# Wraps forge in Docker (no local Foundry needed). Use FOUNDRY_IMAGE to override the image.
FORGE := ./scripts/forge.sh

.PHONY: deps build test fmt lint snapshot
deps:
	$(FORGE) soldeer install
build:
	$(FORGE) build --sizes
test:
	$(FORGE) test -vv
fmt:
	$(FORGE) fmt
lint:
	$(FORGE) fmt --check
snapshot:
	$(FORGE) snapshot
