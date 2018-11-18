install:
	npm install

start:
	npx nodemon --watch .  --ext '.js','.pug' --exec npx gulp server

build:
	rm -rf dist
	npm run build

publish:
	npm publish

lint:
	npx eslint .

test:
	npm test

test-coverage:
	npm test -- --coverage