.PHONY: build check format format-write lint test typecheck

build:
	npm run build

check:
	npm run check
	npm run slophammer

format-write:
	npm run format:write

format:
	npm run format

lint:
	npm run lint

test:
	npm run test:coverage

typecheck:
	npm run typecheck
