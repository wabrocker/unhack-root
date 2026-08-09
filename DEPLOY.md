# Deploying unhackdemocracy.us

Same Hostinger account as `unhack-fl`, root domain rather than the `fl`
subdomain. **`fl/` lives as a sibling folder inside this same document
root** — `domains/unhackdemocracy.us/public_html/fl/` — so this deploy
must never delete anything, only add or update its own files. `build.sh`
has no `--delete` on its rsync for exactly that reason; don't add one.

```
domains/unhackdemocracy.us/public_html/
  index.html   <- from here
  styles.css   <- from here
  .htaccess    <- from here
  fl/          <- unhack-fl's deploy, untouched
```

```bash
./build.sh            # build dist/
./build.sh --deploy   # build, then rsync to the server over SSH
```

No API, no data files, no PHP — this is a static mission/landing page, so
there's nothing here as involved as `unhack-fl`'s DEPLOY.md.

## First deploy note

The domain came with Hostinger's own placeholder (`default.php`,
`default.php.old.php`) already in the docroot. Apache's DirectoryIndex
should prefer `index.html` once it exists, but verify after the first
deploy — if the placeholder still wins, either add an explicit
`DirectoryIndex index.html` to `.htaccess`, or just delete the two
placeholder files (they're Hostinger's scaffold, not anything of ours).
