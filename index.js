var exec = require('child_process').exec;
var Promise = require('bluebird');
var _ = require('lodash');
var uri = require('uri-js');
var qs = require('qs');

var acceptedMethods = ['GET', 'POST'];

var defaultOptions = {
  method: 'GET',
  headers: {},
  raw: false
};

var defaultParams = {
  'negotiate': '',
  'dump-header': '-',
  'location':'',
  'user': ':'
};

var defaultExecOptions = {
  maxBuffer: 1024 * 500
};

function CRP(options, params, execOptions){
  if(_.isEmpty(options.url)){
    throw new Error('url or options.url string is a required argument.');
  }

  options = _.defaults(options, defaultOptions);
  params = _.defaults(params, defaultParams);
  execOptions = _.defaults(execOptions, defaultExecOptions)

  var command = buildCommand(options, params);

  return new Promise(function(resolve, reject){
    exec(command, execOptions, function(error, stdout, stderr){
      if(error){
        return reject(parseForCurlError(error, stdout, stderr, options));
      }
      var response = parseForResponse(error, stdout, stderr, options);
      if(response.status >= 200 && response.status < 300){
        return resolve(response);
      }else{
        return reject(response);
      }
    });
  });
}

function buildCommand(options, params){
  var cmd = 'curl',
      value,
      headers,
      paramKeys = _.keys(params),
      paramString = '-X '+options.method.toUpperCase(),
      payload;

  if(acceptedMethods.indexOf(options.method.toUpperCase()) < 0){
   throw new Error('Invalid method \''+options.method+'\'. Accepted methods are: '+acceptedMethods.join(', '));
  }

  options.url = uri.normalize(options.url);
  if(options.qs){
    options.url += (options.url.indexOf('?') === -1) ? '?' : '&';
    options.url += qs.stringify(options.qs);
  }

  paramString += ' ' + _.map(paramKeys, function(key){
    value = wrapped(params[key]);
    return '--' + key + ' ' + value;
  }).join(' ');

  options.headers = options.headers || {};

  if(options.body){
    payload = ''+options.body;
  }
  if(options.form){
    options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    payload = qs.stringify(options.form);
  }
  if(options.json){
    options.headers['Content-Type'] = 'application/json;charset=UTF-8';
    payload = JSON.stringify(options.json);
  }

  headers = _.keys(options.headers);

  paramString += ' '+ _.map(headers, function(header){
    value = options.headers[header];
    if(options.form && header.toUpperCase() === 'CONTENT-TYPE'){
      value = 'application/x-www-form-urlencoded';
    }
    if(options.json && header.toUpperCase() === 'CONTENT-TYPE'){
      value = 'application/json;charset=UTF-8';
    }
    return '--header '+wrapped(header+': '+value);
  }).join(' ');

  if(payload){
   paramString += ' --data '+wrapped(payload);
  }

  return cmd + ' ' + paramString;
}

function wrapped(string){
  string = ''+string;
  if(string.length > 1){
    string = inDQs(string);
  }
  if(string === '"' || string === '\''){
    string = '\\'+string;
  }
  return string;
}

function inDQs(string){
  return '"'+string.replace(/\"/g,'\\"')+'"';
}

function parseForCurlError(error, stdout, stderr, options){
  var msg = 'Unknown execution error.', i = 0, key = 'curl: (';
  if(error && error.message){
    i = error.message.indexOf(key);
    msg = error.message.substr((i >= 0) ? i : 0);
  }
  return {
    config: options,
    status: 0,
    statusText: msg,
    headers: {},
    error: new Error(stderr)
  };
}

function stripHeaders(lines){
  var headers = {},
      statusLine = lines.shift(),
      statusR = statusLine.split(' '),
      status = parseInt(statusR[1]) || 0,
      statusText = _.trim((status > 0) ? statusR.slice(2).join(' ') : statusLine);

  var header = _.trim(lines.shift()), kindex, key, value;
  while(header && header.length !== 0){
    kindex = header.indexOf(':');
    key = _.trim(header.substr(0, kindex));
    value = _.trim(header.substr(kindex+2));
    headers[key] = value;
    header = _.trim(lines.shift());
  }
  if(/HTTP\/1.1/.test(lines[0])){
    return stripHeaders(lines);
  }else{
    return {
      status: status,
      statusText: statusText,
      headers: headers, 
      data: lines.join('')
    };
  }
}

function parseForResponse(error, stdout, stderr, options){
  var status = 0,
      statusText = '',
      headers = {},
      lines = stdout.split('\r\n'),
      stripped = stripHeaders(lines),
      output = {
        config: options,
        status: stripped.status,
        statusText: stripped.statusText,
        headers: stripped.headers
      };

  try{
    output.data = (options.raw === true) ? stripped.data : JSON.parse(stripped.data);
  }catch(error){
    output.status = 0;
    output.statusText = 'Error parsing response data as JSON.';
    output.headers = {};
    output.error = error
    output.raw = stripped;
  }
  
  return output;
}

function doVerb(verb){
  try{
    return function(url, options){
    	if(arguments.length === 1){
    	  options = _.isPlainObject(url) ? url : {url: url};
    	}
    	options = options || {};
        options.method = verb;
    	options.url = '' + (options.url || url);
    	params = {url: options.url};
        return CRP(options, params, {});
    }
  }catch(error){
    Promise.reject({error: error, status: 0, 
                    statusText: 'Unknown execution error', 
                    headers: {}, 
                    config: options});
  }
}

module.exports.request = doVerb('GET');

module.exports.get = doVerb('GET');

module.exports.post = doVerb('POST');