module.exports = {

  improve: 'apostrophe-docs',

  trashInSchema: true,

  construct: function(self, options) {

    self.apos.define('apostrophe-cursor', require('./lib/cursor.js'));

    var superIsUniqueError = self.isUniqueError;
    self.isUniqueError = function(err) {
      var result = superIsUniqueError(err);
      if (!result) {
        return result;
      }
      if (err && err.message && err.message.match(/workflowGuid/)) {
        return false;
      }
      return result;
    };

    var superGetSlugIndexParams = self.getSlugIndexParams;
    self.getSlugIndexParams = function() {
      var params = superGetSlugIndexParams();
      params.workflowLocale = 1;
      return params;
    };

    var superGetPathLevelIndexParams = self.getPathLevelIndexParams;
    self.getPathLevelIndexParams = function() {
      var params = superGetPathLevelIndexParams();
      params.workflowLocale = 1;
      return params;
    };

    // Solve chicken and egg problem by making sure we have a
    // workflow locale before we test insert permissions

    var superTestInsertPermissions = self.testInsertPermissions;
    self.testInsertPermissions = function(req, doc, options) {
      var workflow = self.apos.modules['apostrophe-workflow'];
      // If not enabled yet, this will be a startup task
      if (workflow) {
        self.ensureSlug(doc);
        workflow.ensureWorkflowLocale(req, doc);
      }
      return superTestInsertPermissions(req, doc, options);
    };

    self.on('beforeSave', 'clearWorkflowCommitted', function(req, doc, options) {
      if (options.workflowCommitted) {
        doc.workflowCommitted = true;
      } else {
        doc.workflowCommitted = false;
      }
    });

  }
};
