PORT ?= 8766
JS := dist/oven-card.js

.PHONY: serve release

# Demo with simulated data: http://<host>:$(PORT)/demo/
serve:
	python3 -m http.server $(PORT) --bind 0.0.0.0

# Usage: make release VERSION=0.2.0
# Needs a "## [VERSION]" section in CHANGELOG.md. Sets the version in the card, commits, tags
# and pushes; the Release workflow publishes the GitHub release that HACS offers as update.
release:
	@test -n "$(VERSION)" || (echo "VERSION is required, e.g. make release VERSION=0.2.0" && exit 1)
	@grep -q '^## \[$(VERSION)\]' CHANGELOG.md || (echo "CHANGELOG.md has no section for $(VERSION)" && exit 1)
	@git diff --quiet HEAD -- . ':!CHANGELOG.md' || (echo "Commit other changes first" && exit 1)
	sed -i 's/^const VERSION = "[^"]*";/const VERSION = "$(VERSION)";/' $(JS)
	git add $(JS) CHANGELOG.md
	git commit -m "chore: release $(VERSION)"
	git tag -a v$(VERSION) -m "v$(VERSION)"
	git push origin HEAD v$(VERSION)
