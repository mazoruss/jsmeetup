var split = require("split");

var Transform = require('stream').Transform;
var util = require('util');

process.stdin.setEncoding('utf8');

function ProblemStream() {
	Transform.call(this, { 'objectMode' : true } );

	this.problemNum = null;
	this.puzzleSize = null;
	this.currentPuzzle = null;
}

function SolutionStream () {
  Transform.call(this, { "objectMode": true });
}

function FormatStream () {
  Transform.call(this, { "objectMode": true });

  this.caseNumber = 0;
}

util.inherits(ProblemStream, Transform);
util.inherits(SolutionStream, Transform);
util.inherits(FormatStream, Transform);


ProblemStream.prototype._transform = function (line, encoding, processed) {
	if (this.problemNum === null) {
		this.problemNum = +line;
	}
	else if (this.puzzleSize === null) {
		this.puzzleSize = (+line) * (+line);
		this.currentPuzzle = [];
	} else {

		var numbers = String(line).match(/\d+/g); // break line into an array of numbers
		this.currentPuzzle.push(numbers); // add a new row to the puzzle
		this.puzzleSize--; // decrement number of remaining lines to parse for puzzle

		if (this.puzzleSize === 0) {
		  this.push(this.currentPuzzle); // we've parsed the full puzzle; add it to the output stream
		  this.puzzleSize = null;

		}
	}

	processed();
};


SolutionStream.prototype._transform = function (problem, encoding, processed) {

  var solution = solve(problem);
  this.push(solution);
  processed();

  function solve (problem) {
    var result = true;
    var answer = '123456789'
    var verifyRows = (matrix) => {
    	var rowresult = true;

    	matrix.forEach(row => {
    		result = result && row.slice().sort().join('') === answer;
    	})
    }
    var verifyColumns = (matrix) => {
    	for (var i = 0; i < 9; i++) {
    		var column = '';
    		for (var j = 0; j < 9; j++) {
    			column += matrix[j][i]
    		}
    		result = result && column.split('').sort().join('') === answer;
    	}

    }
    var verifyBoxes = matrix => {
    	var checkBox = (x, y) => {
    		var values = [];
    		for (var i = 0; i < 3; i++) {
    			for (var j = 0; j < 3; j++) {
    				values.push(matrix[x + i][y + j]);
    			}
    		}
    		result = result && values.sort().join('') === answer;
    	}

    	for (var k = 0; k < 3; k++) {
    		for (var l = 0; l < 3; l++) {
    			checkBox(k * 3, l * 3);
    		}
    	}
    }
    verifyBoxes(problem);
    verifyColumns(problem);
    verifyRows(problem);
    return result;
  }
};

FormatStream.prototype._transform = function (solution, encoding, processed) {

  this.caseNumber++;

  var result = solution ? "Yes" : "No";

  var formatted = "Case #" + this.caseNumber + ": " + result + "\n";

  this.push(formatted);
  // this.push('result');
  processed();

};


process.stdin
    .pipe(split()) // split input into lines
    .pipe(new ProblemStream()) // transform lines into problem data structures
    .pipe(new SolutionStream()) // solve each problem
    .pipe(new FormatStream()) // format the solutions for output
    .pipe(process.stdout); // write solution to stdout

