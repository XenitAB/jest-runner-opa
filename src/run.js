// run.js
const Path = require("path");
const Cp = require("child_process");

module.exports = ({ testPath }) => {
  const start = Date.now();
  const test_folder = Path.dirname(testPath);

  return new Promise((resolve, reject) => {
    const opa_process = Cp.spawn("opa", ["test", "--format=json", test_folder]);

    const data = [];

    opa_process.stdout.on("data", (d) => {
      data.push(d.toString());
    });

    opa_process.on("close", (code) => {
      const end = Date.now();

      const testResults = JSON.parse(data.join("")).reduce((acc, curr) => {
        return [
          ...acc,
          {
            ancestorTitles: [curr.name],
            duration: curr.duration / 1000000,
            fullName: curr.name,
            location: {
              column: curr.location.col,
              line: curr.location.row,
            },
            title: curr.name,
            numPassingAsserts: curr.fail === true ? 0 : 1,
            status: curr.fail === true ? "failed" : "passed",
          },
        ];
      }, []);

      const result_obj = {
        displayName: Path.basename(testPath),
        numFailingtests: testResults.reduce(
          (acc, curr) => (curr.status === "failed" ? acc + 1 : acc),
          0
        ),
        numPassingTests: testResults.reduce(
          (acc, curr) => (curr.status === "passed" ? acc + 1 : acc),
          0
        ),
        numPendingTests: 0,
        numTodoTests: 0,
        perfStats: {
          end: end,
          start: start,
        },
        skipped: false,
        testFilePath: testPath,
        testResults,
        snapshot: {
          added: 0,
          fileDeleted: false,
          matched: 0,
          unchecked: 0,
          uncheckedKeys: [],
          unmatched: 0,
          updated: 0,
        },
      };

      resolve(result_obj);
    });
  });
};
