# Curl Request Promise (CRP)

Wrapper for [`curl`](https://curl.haxx.se/docs/manpage.html) that returns a [Bluebird](https://github.com/petkaantonov/bluebird) promise. Built for a personal experiment - [Request-Promise](https://github.com/request/request-promise) is likely what you're really looking for.

## Installation

```bash
npm i crp
```

## Usage

```js
var crp = require('crp');

// Get from url
crp.get('http://www.google.com')
	.then(function(response){
		// ...
	})
	.catch(function(response){
		// ...
	});

// Post to url
var data = {...};
crp.post('http://post.office.com', {json: data})
	.then(function(response){
		// ...
	})
	.catch(function(response){
		// ...
	});

// Request with custom options
var options = {...};
crp.request(options)
	.then(function(response){
		// ...
	})
	.catch(function(response){
		// ...
	});
```

## API

### .request(url [, options])

The first argument can be either a `url` or an `options` object. The only required option is `url`; all others are optional. `options.url` overrides `url`.

### response

- `data` - The response body - parsed as JSON by default. Returns a `String` when `options.raw = true`.

- `error` - Error object when status code is not in success range.

- `raw` - Returned for parsing errors. Raw server response object - what the response would have looked like (minus `response.config`) if `options.raw = true`.

- `status` - `Number` indicating the HTTP status code of the response.

- `statusText` - HTTP status text of the response (or the execution error summary).

- `headers` - Object of key/value pairs of the response headers. Return `{}` for execution errors.

- `config` - The configuration/options object that was used to generate the request.

A response status code between 200 and 299 is considered a success status and will result in the success callback being called. All other response status codes outside of that range is considered an error and will result in the error callback being called. Codes less than or equal to zero means an execution or configuration based event. Redirects are followed to completion.

### options

- `url` - Fully qualified url. Normalized with [uri.normalize](https://github.com/garycourt/uri-js).

- `method` (**default: `'GET'`**) - HTTP method. Must be a `String`.

- `headers` (**default: `{}`**) - HTTP headers represented as a key/value object.

- `raw` (**default: `false`**) - Disable/enable auto-parse of response body to JSON. Must be a `Boolean`.

- `qs` - Object of querystring values to be appended to the `url` (uses [qs.stringify](https://github.com/hapijs/qs#stringifying) with defaults).

- `body` - Entity body for POST requests. Must be a `String`.

- `form` - Object of querystring values to be included in request body, sets `Content-Type: application/x-www-form-urlencoded` header. Uses [qs.stringify](https://github.com/hapijs/qs#stringifying) with defaults. Overrides `options.body`.

- `json` - Object to be included in request body, sets `Content-Type: application/json;charset=UTF-8` header. Overrides `options.body` and `options.form`.

## Convenience Methods

Shorthands for the HTTP METHODs.

### .get(url [, options])

- Sets `options.method = 'GET'` and ignores conflicting options.

### .post(url [, options])

- Sets `options.method = 'POST'` and ignores conflicting options. 

## Next Up

Creating a TypeScript version.