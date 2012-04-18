var router      = module.exports
  , underscore  = require('underscore')
  , pages       = require('./request_handlers/pages.js')
  , files       = require('./request_handlers/files.js')


var TRAILING_SLASH          = /\/$/
  , OPTIONAL_TRAILING_SLASH = /(\/)?/
  , FILE_FORMAT             = /\(\.\:format\)$/
  , PARAM_KEYS              = /:([A-Za-z_])+/g
  , OPTIONAL_PARENS         = /\(([^)]+)\)/g
  , PARAM                   = /([0-9A-Za-z_]+)/
  , PARAM_GLOB_REPR         = /\*[0-9A-Za-z_]+/
  , PARAM_GLOB_REGEX        = /.*/


var getRegexRepr = function (url) {

  // match param keys
  var match   = url.match(PARAM_KEYS);
  var params  = (match) ? match.map( function (val) { return val.replace(':', '') }) : null;
  
  url = url.replace(/\)/g, ')?');               // replace optional parens with optional regex
  url = url.replace(PARAM_GLOB_REPR, PARAM_GLOB_REGEX.source)
  url = url.replace(PARAM_KEYS, PARAM.source);  // replace param keys with param groups

  // append optional trailing slash so it routes to the same place
  if (TRAILING_SLASH.test(url)) {
    url = url.replace(TRAILING_SLASH, OPTIONAL_TRAILING_SLASH.source);
  } else if (!FILE_FORMAT.test(url)) {
    url += OPTIONAL_TRAILING_SLASH.source;
  }

  return new RegExp( '^' + url + '$' );

}


router.routes = [];
router.addRoute = function (url, handler) {
  router.routes.push({
    url: getRegexRepr(url),
    handler: handler
  })
}


router.errors = {
  
  '403': function (req, res) {
    res.statusCode = 403;
    res.end('403');
  },

  '404': function (req, res) {
    res.statusCode = 404;
    res.end('404');
  },

  '500': function (req, res) {
    res.statusCode = 500;
    res.end('500');
  }

}



router.routeRequest = function (req, res) {

  var route = router.getRoute(req.url);

  if (route) {

    try {
      route.handler(req, res);
    } catch (err) {
      console.error(err);
      router.errors['500'](req, res);
    }
  
  } else {
    router.errors['404'](req, res);
  }

};



router.getRoute = function (url) {
  return underscore.find(router.routes, function (route) {
    return route.url.test(url);
  })
}
