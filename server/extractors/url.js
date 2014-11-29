var when       = require('when'),
    url        = require('url'),
    logger     = require('../helpers').logger,
    errors     = require('../helpers').errors,
    validators = require('../helpers').validators,
    request    = require('request');

/**
 * URL content extractor.
 * @module url
 */
module.exports = {
  /**
   * Extract online content of a document.
   * Redirect to proper extractor regarding content-type.
   * If content-type is not supported, document is return as is.
   * @param {Document} doc
   * @return {Promise} Promise of the document with extracted content.
   */
  extract: function(doc) {
    logger.debug('Using URL extractor.');
    var extracted = when.defer();
    if (!validators.isURL(doc.content)) {
      return when.reject(new errors.BadRequest('URL not valid: ' + doc.content));
    }
    doc.link = doc.content;

    request.head(doc.link, function (err, res) {
      if (err) return extracted.reject(err);
      var filename = url.parse(doc.link).pathname;
      filename = filename.substring(filename.lastIndexOf('/') + 1);
      doc.contentType = res.headers['content-type'];
      doc.attachment = {
        name: filename,
        stream: request.get(doc.link),
        contentType: res.headers['content-type'],
        contentLength: res.headers['content-length']
      };
      // Get HTTP content...
      module.parent.exports.get(doc.contentType).extract(doc)
      .then(extracted.resolve, extracted.reject);
    });

    return extracted.promise;
  }
};
