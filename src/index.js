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
            activePiece: null,
            moves: [],
            jumpKills: null,
            hasJumped: null,
            stepNumber: 0,
            winner: null,
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

    getCurrentState() {
        const history = this.state.history.slice(0, this.state.stepNumber + 1);
        return history[history.length - 1];
    }

    getCorners(coordinates) {

        const col = getColAsInt(this.columns, coordinates);
        const row = getRowAsInt(coordinates);

        const columnLeft  = col -1 >= 0 ? getColAsAlph(this.columns, col - 1) : false;
        const columnRight = col +1 <= 7 ? getColAsAlph(this.columns, col + 1) : false;

        const rowUpper = row +1 < 9 ? row +1 : false;
        const rowLower = row -1 > 0 ? row -1 : false;

        let corners = {};

        corners.leftUpper  = columnLeft  !== false && rowUpper !== false ? columnLeft  + rowUpper : null;
        corners.rightUpper = columnRight !== false && rowUpper !== false ? columnRight + rowUpper : null;
        corners.leftLower  = columnLeft  !== false && rowLower !== false ? columnLeft  + rowLower : null;
        corners.rightLower = columnRight !== false && rowLower !== false ? columnRight + rowLower : null;

        return corners;

    }

    getMoves(currentState, coordinates, isKing = false, hasJumped = false) {

        let moves = [];
        let jumps = [];

        let killJumps = {};

        const corners = this.getCorners(coordinates);

        const row = getRowAsInt(coordinates);
        const player = returnPlayerName(currentState.currentPlayer);

        const advanceRow = player === 'player1' ? row - 1 : row + 1;
        const boardState = currentState.boardState;

        for (let key in corners) {
            if (!corners.hasOwnProperty(key)) {
                continue;
            }

            let cornerCoordinates = corners[key];

            if (cornerCoordinates === null) {
                continue;
            }

            if (!isKing && cornerCoordinates.indexOf(advanceRow) < 0) {
                continue;
            }

            if (boardState[cornerCoordinates] === null) {
                moves.push(cornerCoordinates);
            } else {
                let neighborPiece = boardState[cornerCoordinates];

                if (neighborPiece.player === player) {
                    continue;
                }

                let opponentCorners = this.getCorners(cornerCoordinates);
                let potentialJump = opponentCorners[key];

                if (boardState[potentialJump] === null) {
                    killJumps[cornerCoordinates] = potentialJump;
                    jumps.push(potentialJump);
                }
            }
        }

        let movesOut;

        if (hasJumped === false) {
            movesOut = moves.concat(jumps);
        } else {
            movesOut = jumps;
        }

        let killJumpsOut = jumps.length > 0 ? killJumps : null;

        return [movesOut, killJumpsOut];

    }

    movePiece(currentState, coordinates) {
        let boardState = currentState.boardState;
        let movingPiece = Object.assign({}, boardState[this.state.activePiece]);

        let jumpArray = [];

        for (let key in this.state.jumpKills) {
            if (!this.state.jumpKills.hasOwnProperty(key)) {
                continue;
            }

            jumpArray.push(this.state.jumpKills[key]);
        }

        if (this.state.moves.indexOf(coordinates) > -1 || jumpArray.indexOf(coordinates) > -1) {

            // King me
            if (this.shouldKing(movingPiece, coordinates)) {
                movingPiece.isKing = true;
            }

            // Move piece to new coordinates
            boardState[this.state.activePiece] = null;
            boardState[coordinates] = movingPiece;

            // Remove opponent piece if jump is made
            let hasJumped = false;
            let newMoves = [];

            if (jumpArray.indexOf(coordinates) > -1) {
                let opponentPosition = getKeyByValue(this.state.jumpKills, coordinates);
                boardState[opponentPosition] = null;

                hasJumped = true;
                newMoves = this.getMoves(currentState, coordinates, movingPiece.isKing, true);
            }

            const player = movingPiece.player;
            let setCurrentPlayer = !currentState.currentPlayer;
            let setActivePiece = null;

            if (hasJumped === true) {
                if (newMoves[0].length > 0) {
                    setCurrentPlayer = currentState.currentPlayer;
                    setActivePiece = coordinates;
                }
            }

            this.setState({
                history: this.state.history.concat([{
                    boardState: boardState,
                    currentPlayer: setCurrentPlayer,
                }]),
                activePiece: setActivePiece,
                moves: hasJumped === true ? newMoves[0] : [],
                jumpKills: hasJumped === true ? newMoves[1] : null,
                hasJumped: hasJumped === true ? player : null,
                stepNumber: this.state.history.length,
            });
        }
    }

    shouldKing(movingPiece, coordinates) {

        if (movingPiece.isKing === true) {
            return false;
        }

        const row = getRowAsInt(coordinates);
        const player = movingPiece.player;

        return ( (row === 1 && player === 'player1') || (row === 8 && player === 'player2') );
    }

    handleClick(coordinates) {
        const currentState = this.getCurrentState();
        const boardState = currentState.boardState;
        const clickedSquare = boardState[coordinates];

        if (clickedSquare !== null) {

            // Can't select opponents pieces
            if (clickedSquare.player !== returnPlayerName(currentState.currentPlayer)) {
                return;
            }

            // Unset active piece if it's clicked
            if (this.state.activePiece === coordinates && this.state.hasJumped === null) {
                this.setState({
                    activePiece: null,
                    moves: [],
                    jumpKills: null,
                });
                return;
            }

            // Set active piece
            let movesData = this.getMoves(currentState, coordinates, clickedSquare.isKing, false);

            this.setState({
                activePiece: coordinates,
                moves: movesData[0],
                jumpKills: movesData[1],
            });

            return;
        }

        if (this.state.activePiece === null) {
            return;
        }

        if (this.state.moves.length > 0) {
            this.movePiece(currentState, coordinates);
        }
    }

    render() {
        const columns = this.columns;
        const history = this.state.history;
        const activePiece = this.state.activePiece;
        const currentState = history[this.state.stepNumber];
        const boardState = currentState.boardState;
        const currentPlayer = currentState.currentPlayer;
        const moves = this.state.moves;

        // console.log(this.state);

        return(
            <Board
                boardState = {boardState}
                currentPlayer = {currentPlayer}
                activePiece = {activePiece}
                moves = {moves}
                columns = {columns}
                onClick = {(coordinates) => this.handleClick(coordinates)}
            />
        );
    }
}

function Square(props) {

    const squareClasses = props['squareClasses'];
    const onClick = props['onClick'];

    return (
        <button className = { "square " + (squareClasses) } onClick={onClick} />
    );
}

class Board extends React.Component {
    constructor(props) {
        super(props);

        this.boardState = props.boardState;
        this.activePiece = props.activePiece;
        this.currentPlayer = props.currentPlayer;
        this.moves = props.moves;
        this.columns = props.columns;
        this.onClick = props.onClick;
    }

    renderSquare(coordinates, squareClasses) {
        return (
            <Square
                key = {coordinates}
                squareClasses = {squareClasses}
                onClick = {() => this.onClick(coordinates) }
            />
        );
    }

    render() {
        let boardRender = [];
        let columnsRender = [];

        let moves = this.props.moves;

        for (let coordinates in this.boardState) {

            if (!this.boardState.hasOwnProperty(coordinates)) {
                continue;
            }

            let col = getColAsInt(this.columns, coordinates);
            let row = getRowAsInt(coordinates);

            let currentPlayer = returnPlayerName(this.props.currentPlayer);

            let colorClass  = ( (isOdd(col) && isOdd(row)) || (!isOdd(col) && !(isOdd(row)) ) ) ? 'white' : 'black';

            let squareClasses = [];

            squareClasses.push(coordinates);
            squareClasses.push(colorClass);

            if (this.props.activePiece === coordinates) {
                squareClasses.push('isActive');
            }

            if (moves.indexOf(coordinates) > -1) {
                let moveClass = 'movable ' + currentPlayer + '-move';
                squareClasses.push(moveClass);
            }

            if (this.boardState[coordinates] !== null) {
                squareClasses.push(this.boardState[coordinates].player + ' piece');

                if (this.boardState[coordinates].isKing === true ) {
                    squareClasses.push('king');
                }
            }

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

function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

function getColAsInt(columns, coordinate) {
    return columns[coordinate.charAt(0)];
}

function getColAsAlph(columns, columnInt) {

    for (let key in columns) {
        if (!columns.hasOwnProperty(key)) {
            continue;
        }

        if (columnInt === columns[key]) {
            return key;
        }
    }

    return false;
}

function getRowAsInt(coordinate) {
    return parseInt(coordinate.charAt(1), 10);
}

function returnPlayerName(playerBool) {
    return playerBool === true ? 'player1' : 'player2';
}