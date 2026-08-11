#!/usr/bin/env bash
# Build dist/ — the contents of the root domain's document root.
#
# Same content-hash-on-CSS trick as unhack-fl/build.sh, so a style change
# doesn't need a manual cache purge.
#
#   ./build.sh            build dist/
#   ./build.sh --deploy   build, then rsync to the server over SSH
#
# IMPORTANT: the target directory also holds fl/ (the Florida subdomain's
# own docroot, a sibling here rather than a separate vhost). rsync below
# deliberately has no --delete, so it can only add/update the files this
# script actually produces — it must never be given one, or a deploy from
# here would wipe out fl/.
set -euo pipefail
cd "$(dirname "$0")"

REMOTE_HOST="hostinger"
REMOTE_DIR="domains/unhackdemocracy.us/public_html"

rm -rf dist unhack-root-deploy.zip
mkdir -p dist

cp web/logo.svg web/social-preview.jpg web/social-preview-hero.jpg dist/
cp web/.htaccess dist/.htaccess

hash_of() { shasum -a 256 "$1" | cut -c1-8; }

CSS_HASH=$(hash_of web/styles.css)
for page in index about states; do
  sed "s|href=\"styles\.css\"|href=\"styles.css?v=${CSS_HASH}\"|" \
    "web/${page}.html" > "dist/${page}.html"
  grep -q "styles.css?v=${CSS_HASH}" "dist/${page}.html" || { echo "FAIL: css not stamped in ${page}.html"; exit 1; }
done
cp web/styles.css "dist/styles.css"

( cd dist && zip -qr ../unhack-root-deploy.zip . -x ".DS_Store" )

echo "built dist/  css=${CSS_HASH}"

if [[ "${1:-}" == "--deploy" ]]; then
  echo "deploying to ${REMOTE_HOST}:~/${REMOTE_DIR}/ (fl/ untouched — no --delete)"
  rsync -az --no-perms --omit-dir-times \
    -e "ssh -o BatchMode=yes" dist/ "${REMOTE_HOST}:~/${REMOTE_DIR}/"
  echo "deployed. verifying what's served:"
  sleep 2
  curl -s --max-time 20 "https://unhackdemocracy.us/styles.css?v=${CSS_HASH}" \
    | grep -c "unhackdemocracy.us on purpose" | sed 's/^/  styles.css served correctly: /'
  echo "  homepage title: $(curl -s --max-time 20 https://unhackdemocracy.us | grep -o '<title>[^<]*' | head -1)"
fi
