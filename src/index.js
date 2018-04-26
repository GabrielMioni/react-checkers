import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

class ReactCheckers extends React.Component {

    constructor(props) {
        super(props);

        this.columns = this.setColumns();

        this.state = {
            history: [{
                boardState: this.createBoard(),
                currentPlayer: true,
            }],
            moves: [],
            stepNumber: 0,
        }
    }

    setColumns() {
        const columns = {};
        columns.a = 0;
        columns.b = 1;
        columns.c = 2;
        columns.d = 3;
        columns.e = 4;
        columns.f = 5;
        columns.g = 6;
        columns.h = 7;

        return columns;
    }

    createBoard() {

        let board = {};

        for (let key in this.columns) {

            if (this.columns.hasOwnProperty(key)) {
                for (let n = 1; n <= 8 ; ++n) {

                    let row = key + n;
                    board[row] = null;
                }
            }
        }

        board = this.initPlayers(board);

        return board;
    }

    initPlayers(board) {
        const player1 = ['a8', 'c8', 'e8', 'g8', 'b7', 'd7', 'f7', 'h7', 'a6', 'c6', 'e6', 'g6',];
        const player2 = ['b3', 'd3', 'f3', 'h3', 'a2', 'c2', 'e2', 'g2', 'b1', 'd1', 'f1', 'h1',];

        let self = this;

        player1.forEach(function (i) {
            board[i] = self.createPiece(i, 'player1');
        });

        player2.forEach(function (i) {
            board[i] = self.createPiece(i, 'player2');
        });

        return board;
    }

    createPiece(location, player) {
        let piece = {};

        piece.player   = player;
        piece.location = location;
        piece.isKing   = false;

        return piece;
    }

    render() {
        const columns = this.columns;
        const history = this.state.history;
        const currentState = history[this.state.stepNumber];
        const boardState = currentState.boardState;
        const currentPlayer = currentState.currentPlayer;

        return(
            <Board
                boardState = {boardState}
                currentPlayer = {currentPlayer}
                moves = {this.state.moves}
                columns = {columns}
            />
        );
    }
}

function Square(props) {

    let coordinates = props['coordinates'];
    let squareClasses = props['squareClasses'];
    let onClick = props['onClick'];

    return (
        <button className = { "square " + (squareClasses) } onClick={onClick} />
    );
}

class Board extends React.Component {
    constructor(props) {
        super(props);

        this.boardState = props.boardState;
        this.currentPlayer = props.currentPlayer;
        this.moves = props.moves;
        this.columns = props.columns;
    }

    renderSquare(coordinates, squareClasses) {
        return (
            <Square
                key = {coordinates}
                squareClasses = {squareClasses}
            />
        );
    }

    render() {
        let boardRender = [];
        let columnsRender = [];

        for (let coordinates in this.boardState) {

            if (!this.boardState.hasOwnProperty(coordinates)) {
                continue;
            }

            let col = getColAsInt(this.columns, coordinates);
            let row = getRowAsInt(coordinates);

            let player = returnPlayerName(this.currentPlayer);

            let playerMoveClass = player + ('-move');
            let moveToClass = this.moves.indexOf(coordinates) > -1 ? 'movable ' + player : '';
            let colorClass  = ( isOdd(col) && isOdd(row) || (!isOdd(col) && !(isOdd(row)) ) ) ? 'white' : 'black';

            let squareClasses = [];
            squareClasses.push(coordinates);
            squareClasses.push(playerMoveClass);
            squareClasses.push(moveToClass);
            squareClasses.push(colorClass);

            squareClasses = squareClasses.join(' ');

            columnsRender.push(this.renderSquare(coordinates, squareClasses, this.boardState[coordinates]));

            if (columnsRender.length >= 8) {
                columnsRender = columnsRender.reverse();
                boardRender.push(<div key={boardRender.length} className="board-col">{columnsRender}</div>);
                columnsRender = [];
            }
        }

        return (boardRender);
    }
}

// ========================================

ReactDOM.render(
    <ReactCheckers />,
    document.getElementById('root')
);

function isOdd(n) {
    return Math.abs(n % 2) === 1;
}

function getColAsInt(columns, coordinate) {
    return columns[coordinate.charAt(0)];
}

function getRowAsInt(coordinate) {
    return parseInt(coordinate.charAt(1), 10);
}

function returnPlayerName(playerBool) {
    return playerBool === true ? 'player1' : 'player2';
}