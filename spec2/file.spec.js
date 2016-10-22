var fse = require('fs-extra');
var expect = require('chai').expect;
var helper = require('./helper');
var jetpack = require('..');

describe('file', function () {
  beforeEach(helper.setCleanTestCwd);
  afterEach(helper.switchBackToCorrectCwd);

  describe("creates file if it doesn't exist", function () {
    var expectations = function () {
      expect('file.txt').to.have.content('');
    };

    it('sync', function () {
      jetpack.file('file.txt');
      expectations();
    });

    it('async', function (done) {
      jetpack.fileAsync('file.txt')
      .then(function () {
        expectations();
        done();
      })
      .catch(done);
    });
  });

  describe('leaves file intact if it already exists', function () {
    var preparations = function () {
      fse.outputFileSync('file.txt', 'abc');
    };

    var expectations = function () {
      expect('file.txt').to.have.content('abc');
    };

    it('sync', function () {
      preparations();
      jetpack.file('file.txt');
      expectations();
    });

    it('async', function (done) {
      preparations();
      jetpack.fileAsync('file.txt')
      .then(function () {
        expectations();
        done();
      })
      .catch(done);
    });
  });

  describe('can save file content given as string', function () {
    var expectations = function () {
      expect('file.txt').to.have.content('ąbć');
    };

    it('sync', function () {
      jetpack.file('file.txt', { content: 'ąbć' });
      expectations();
    });

    it('async', function (done) {
      jetpack.fileAsync('file.txt', { content: 'ąbć' })
      .then(function () {
        expectations();
        done();
      })
      .catch(done);
    });
  });

  describe('can save file content given as buffer', function () {
    var expectations = function () {
      var buf = fse.readFileSync('file');
      expect(buf[0]).to.equal(11);
      expect(buf[1]).to.equal(22);
      expect(buf.length).to.equal(2);
    };

    it('sync', function () {
      jetpack.file('file', { content: new Buffer([11, 22]) });
      expectations();
    });

    it('async', function (done) {
      jetpack.fileAsync('file', { content: new Buffer([11, 22]) })
      .then(function () {
        expectations();
        done();
      })
      .catch(done);
    });
  });

  describe('can save file content given as plain JS object (will be saved as JSON)', function () {
    var obj = {
      a: 'abc',
      b: 123
    };

    var expectations = function () {
      var data = JSON.parse(fse.readFileSync('file.txt', 'utf8'));
      expect(data).to.eql(obj);
    };

    it('sync', function () {
      jetpack.file('file.txt', { content: obj });
      expectations();
    });

    it('async', function (done) {
      jetpack.fileAsync('file.txt', { content: obj })
      .then(function () {
        expectations();
        done();
      })
      .catch(done);
    });
  });

  describe('written JSON data can be indented', function () {
    var obj = {
      a: 'abc',
      b: 123
    };

    var expectations = function () {
      var sizeA = fse.statSync('a.json').size;
      var sizeB = fse.statSync('b.json').size;
      var sizeC = fse.statSync('c.json').size;
      expect(sizeB).to.be.above(sizeA);
      expect(sizeC).to.be.above(sizeB);
    };

    it('sync', function () {
      jetpack.file('a.json', { content: obj, jsonIndent: 0 });
      jetpack.file('b.json', { content: obj }); // Default indent = 2
      jetpack.file('c.json', { content: obj, jsonIndent: 4 });
      expectations();
    });

    it('async', function (done) {
      jetpack.fileAsync('a.json', { content: obj, jsonIndent: 0 })
      .then(function () {
        return jetpack.fileAsync('b.json', { content: obj }); // Default indent = 2
      })
      .then(function () {
        return jetpack.fileAsync('c.json', { content: obj, jsonIndent: 4 });
      })
      .then(function () {
        expectations();
        done();
      })
      .catch(done);
    });
  });

  describe('replaces content of already existing file', function () {
    var preparations = function () {
      fse.writeFileSync('file.txt', 'abc');
    };

    var expectations = function () {
      expect('file.txt').to.have.content('123');
    };

    it('sync', function () {
      preparations();
      jetpack.file('file.txt', { content: '123' });
      expectations();
    });

    it('async', function (done) {
      preparations();
      jetpack.fileAsync('file.txt', { content: '123' })
      .then(function () {
        expectations();
        done();
      })
      .catch(done);
    });
  });

  describe('throws if given path is not a file', function () {
    var preparations = function () {
      fse.mkdirsSync('a');
    };

    var expectations = function (err) {
      expect(err.message).to.have.string('exists but is not a file.');
    };

    it('sync', function () {
      preparations();
      try {
        jetpack.file('a');
        throw new Error('Expected error to be thrown');
      } catch (err) {
        expectations(err);
      }
    });

    it('async', function (done) {
      preparations();
      jetpack.fileAsync('a')
      .catch(function (err) {
        expectations(err);
        done();
      })
      .catch(done);
    });
  });

  describe("if directory for file doesn't exist creates it as well", function () {
    var expectations = function () {
      expect('a/b/c.txt').to.have.content('');
    };

    it('sync', function () {
      jetpack.file('a/b/c.txt');
      expectations();
    });

    it('async', function (done) {
      jetpack.fileAsync('a/b/c.txt')
      .then(function () {
        expectations();
        done();
      })
      .catch(done);
    });
  });

  describe('returns currently used jetpack instance', function () {
    var expectations = function (jetpackContext) {
      expect(jetpackContext).to.equal(jetpack);
    };

    it('sync', function () {
      expectations(jetpack.file('file.txt'));
    });

    it('async', function (done) {
      jetpack.fileAsync('file.txt')
      .then(function (jetpackContext) {
        expectations(jetpackContext);
        done();
      })
      .catch(done);
    });
  });

  describe('respects internal CWD of jetpack instance', function () {
    var expectations = function () {
      expect('a/b.txt').to.have.content('');
    };

    it('sync', function () {
      var jetContext = jetpack.cwd('a');
      jetContext.file('b.txt');
      expectations();
    });

    it('async', function (done) {
      var jetContext = jetpack.cwd('a');
      jetContext.fileAsync('b.txt')
      .then(function () {
        expectations();
        done();
      })
      .catch(done);
    });
  });

  if (process.platform !== 'win32') {
    describe('sets mode of newly created file (unix only)', function () {
      var expectations = function () {
        expect(helper.mode('file.txt')).to.equal('711');
      };

      it('sync, mode passed as string', function () {
        jetpack.file('file.txt', { mode: '711' });
        expectations();
      });

      it('sync, mode passed as number', function () {
        jetpack.file('file.txt', { mode: parseInt('711', 8) });
        expectations();
      });

      it('async, mode passed as string', function (done) {
        jetpack.fileAsync('file.txt', { mode: '711' })
        .then(function () {
          expectations();
          done();
        })
        .catch(done);
      });

      it('async, mode passed as number', function (done) {
        jetpack.fileAsync('file.txt', { mode: parseInt('711', 8) })
        .then(function () {
          expectations();
          done();
        })
        .catch(done);
      });
    });

    describe("changes mode of existing file if it doesn't match (unix only)", function () {
      var preparations = function () {
        fse.writeFileSync('file.txt', 'abc', { mode: '700' });
      };

      var expectations = function () {
        expect(helper.mode('file.txt')).to.equal('511');
      };

      it('sync', function () {
        preparations();
        jetpack.file('file.txt', { mode: '511' });
        expectations();
      });

      it('async', function (done) {
        preparations();
        jetpack.fileAsync('file.txt', { mode: '511' })
        .then(function () {
          expectations();
          done();
        })
        .catch(done);
      });
    });

    describe('leaves mode of file intact if not explicitly specified (unix only)', function () {
      var preparations = function () {
        fse.writeFileSync('file.txt', 'abc', { mode: '700' });
      };

      var expectations = function () {
        expect(helper.mode('file.txt')).to.equal('700');
      };

      it('sync, ensure exists', function () {
        preparations();
        jetpack.file('file.txt');
        expectations();
      });

      it('sync, ensure content', function () {
        preparations();
        jetpack.file('file.txt', { content: 'abc' });
        expectations();
      });

      it('async, ensure exists', function (done) {
        preparations();
        jetpack.fileAsync('file.txt')
        .then(function () {
          expectations();
          done();
        })
        .catch(done);
      });

      it('async, ensure content', function (done) {
        preparations();
        jetpack.fileAsync('file.txt', { content: 'abc' })
        .then(function () {
          expectations();
          done();
        })
        .catch(done);
      });
    });
  } else {
    describe('specyfying mode have no effect and throws no error (windows only)', function () {
      it('sync', function () {
        jetpack.file('file.txt', { mode: '711' });
      });

      it('async', function (done) {
        jetpack.fileAsync('file.txt', { mode: '711' })
        .then(function () {
          done();
        })
        .catch(done);
      });
    });
  }
});
