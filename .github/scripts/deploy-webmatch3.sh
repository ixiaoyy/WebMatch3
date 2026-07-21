#!/usr/bin/env bash
set -Eeuo pipefail

readonly release_sha="${1:-}"
readonly archive_path="${2:-}"
readonly app_root="/opt/webmatch3"
readonly releases_root="$app_root/releases"
readonly incoming_root="$app_root/incoming"
readonly release_dir="$releases_root/$release_sha"
readonly staging_dir="$releases_root/.$release_sha.staging"
readonly expected_archive="$incoming_root/webmatch3-$release_sha.tar.gz"
readonly production_container="webmatch3"
readonly rollback_container="webmatch3-rollback"
readonly candidate_container="webmatch3-candidate-${release_sha:0:12}"
readonly nginx_image="nginx:alpine"
readonly production_port="8088"
readonly production_network="parallellines_default"

if [[ ! "$release_sha" =~ ^[0-9a-f]{40}$ ]]; then
  printf 'Invalid release SHA.\n' >&2
  exit 2
fi

if [[ "$archive_path" != "$expected_archive" || ! -f "$archive_path" ]]; then
  printf 'Release archive is missing or outside the incoming directory.\n' >&2
  exit 2
fi

cleanup() {
  docker rm -f "$candidate_container" >/dev/null 2>&1 || true
  if [[ -d "$staging_dir" ]]; then
    rm -rf -- "$staging_dir"
  fi
}
trap cleanup EXIT

mkdir -p "$releases_root" "$incoming_root"
if ! docker network inspect "$production_network" >/dev/null 2>&1; then
  printf 'Required production Docker network is missing.\n' >&2
  exit 3
fi

if [[ -d "$release_dir" ]]; then
  deployed_sha="$(tr -d '\r\n' < "$release_dir/release.txt")"
  if [[ "$deployed_sha" != "$release_sha" ]]; then
    printf 'Existing release directory has the wrong release marker.\n' >&2
    exit 3
  fi
else
  rm -rf -- "$staging_dir"
  mkdir -p "$staging_dir"
  tar -xzf "$archive_path" -C "$staging_dir" --no-same-owner

  if [[ ! -f "$staging_dir/index.html" || ! -f "$staging_dir/release.txt" ]]; then
    printf 'Release archive is missing required files.\n' >&2
    exit 3
  fi

  packaged_sha="$(tr -d '\r\n' < "$staging_dir/release.txt")"
  if [[ "$packaged_sha" != "$release_sha" ]]; then
    printf 'Release marker does not match the requested SHA.\n' >&2
    exit 3
  fi

  mv "$staging_dir" "$release_dir"
fi

docker pull "$nginx_image" >/dev/null
docker rm -f "$candidate_container" >/dev/null 2>&1 || true
docker run -d \
  --name "$candidate_container" \
  --network none \
  -v "$release_dir:/usr/share/nginx/html:ro" \
  "$nginx_image" >/dev/null

candidate_ready=false
for _ in {1..20}; do
  if docker exec "$candidate_container" wget -qO- http://127.0.0.1/ >/dev/null 2>&1; then
    candidate_ready=true
    break
  fi
  sleep 1
done

if [[ "$candidate_ready" != true ]]; then
  docker logs "$candidate_container" >&2 || true
  printf 'Candidate container did not become healthy.\n' >&2
  exit 4
fi

candidate_sha="$(docker exec "$candidate_container" cat /usr/share/nginx/html/release.txt | tr -d '\r\n')"
if [[ "$candidate_sha" != "$release_sha" ]]; then
  printf 'Candidate container serves the wrong release.\n' >&2
  exit 4
fi
docker rm -f "$candidate_container" >/dev/null

had_previous=false
if docker container inspect "$production_container" >/dev/null 2>&1; then
  had_previous=true
  docker rm -f "$rollback_container" >/dev/null 2>&1 || true
  docker stop --time 10 "$production_container" >/dev/null
  docker rename "$production_container" "$rollback_container"
fi

restore_previous() {
  docker rm -f "$production_container" >/dev/null 2>&1 || true
  if [[ "$had_previous" == true ]] && docker container inspect "$rollback_container" >/dev/null 2>&1; then
    docker rename "$rollback_container" "$production_container"
    docker start "$production_container" >/dev/null
  fi
}

if ! docker run -d \
  --name "$production_container" \
  --restart unless-stopped \
  --network "$production_network" \
  -p "$production_port:80" \
  -v "$release_dir:/usr/share/nginx/html:ro" \
  "$nginx_image" >/dev/null; then
  restore_previous
  printf 'Unable to start the production container; previous release restored.\n' >&2
  exit 5
fi

production_ready=false
for _ in {1..20}; do
  served_sha="$(curl -fsS "http://127.0.0.1:$production_port/release.txt" 2>/dev/null | tr -d '\r\n' || true)"
  if [[ "$served_sha" == "$release_sha" ]]; then
    production_ready=true
    break
  fi
  sleep 1
done

if [[ "$production_ready" != true ]]; then
  docker logs "$production_container" >&2 || true
  restore_previous
  printf 'Production health check failed; previous release restored.\n' >&2
  exit 5
fi

ln -sfn "$release_dir" "$app_root/current.next"
mv -Tf "$app_root/current.next" "$app_root/current"
rm -f -- "$archive_path"

printf 'Deployed %s to WebMatch3 production.\n' "$release_sha"
