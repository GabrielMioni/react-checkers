import React from 'react';
import ReactDOM from 'react-dom';
import * as utils from './utils.js';
import {ReactCheckers} from './ReactCheckers.js';
import Board from './Board.js';
import { Router } from 'react-router-dom'
import createBrowserHistory from 'history/createBrowserHistory'
import './index.css';

const browserHistory = createBrowserHistory();

class Game extends React.Component {

    constructor(props) {
        super(props);

        this.columns = this.setColumns();

        this.ReactCheckers = new ReactCheckers(this.columns);

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

        const col = utils.getColAsInt(this.columns, coordinates);
        const row = utils.getRowAsInt(coordinates);

        const columnLeft  = col -1 >= 0 ? utils.getColAsAlph(this.columns, col - 1) : false;
        const columnRight = col +1 <= 7 ? utils.getColAsAlph(this.columns, col + 1) : false;

        const rowUpper = row +1 < 9 ? row +1 : false;
        const rowLower = row -1 > 0 ? row -1 : false;

        let corners = {};

        corners.leftUpper  = columnLeft  !== false && rowUpper !== false ? columnLeft  + rowUpper : null;
        corners.rightUpper = columnRight !== false && rowUpper !== false ? columnRight + rowUpper : null;
        corners.leftLower  = columnLeft  !== false && rowLower !== false ? columnLeft  + rowLower : null;
        corners.rightLower = columnRight !== false && rowLower !== false ? columnRight + rowLower : null;

        return corners;

    }

    getMoves(boardState, coordinates, isKing = false, hasJumped = false) {

        if (boardState[coordinates] === null) {
            return [];
        }

        let moves = [];
        let jumps = [];

        let killJumps = {};

        const corners = this.getCorners(coordinates);

        const row = utils.getRowAsInt(coordinates);
        const player = boardState[coordinates].player;

        const advanceRow = player === 'player1' ? row - 1 : row + 1;

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

    movePiece(coordinates) {
        const currentState = Object.assign({}, this.state.history[this.state.stepNumber]);
        let mostRecentBoardState = Object.assign({}, currentState.boardState);
        let movingPiece = Object.assign({}, mostRecentBoardState[this.state.activePiece]);

        let jumpArray = [];

        for (let key in this.state.jumpKills) {
            if (!this.state.jumpKills.hasOwnProperty(key)) {
                continue;
            }

            jumpArray.push(this.state.jumpKills[key]);
        }

        // Don't move if the coordinates don't match a moveable or jumpable square.
        if (this.state.moves.indexOf(coordinates) < 0 && jumpArray.indexOf(coordinates) < 0) {
            return;
        }

        // King me maybe?
        if (this.shouldKing(movingPiece, coordinates)) {
            movingPiece.isKing = true;
        }

        // Move piece to new coordinates
        mostRecentBoardState[this.state.activePiece] = null;
        mostRecentBoardState[coordinates] = movingPiece;

        // Remove opponent piece if jump is made
        const player = movingPiece.player;
        let hasJumped = null;
        let newMoves = [];
        let setCurrentPlayer = player === 'player2';
        let setActivePiece = null;

        if (jumpArray.indexOf(coordinates) > -1) {
            let opponentPosition = utils.getKeyByValue(this.state.jumpKills, coordinates);
            mostRecentBoardState[opponentPosition] = null;

            newMoves = this.getMoves(mostRecentBoardState, coordinates, movingPiece.isKing, true);

            if (newMoves[0].length > 0) {
                hasJumped = true;
                setCurrentPlayer = mostRecentBoardState.currentPlayer;
                setActivePiece = coordinates;
            } else {
                hasJumped = null;
            }
        }

        if (hasJumped === true) {
            if (newMoves[0].length > 0) {
                setCurrentPlayer = mostRecentBoardState.currentPlayer;
                setActivePiece = coordinates;
            }
        }

        this.setState({
            history: this.state.history.concat([{
                boardState: mostRecentBoardState,
                currentPlayer: setCurrentPlayer,
            }]),
            activePiece: setActivePiece,
            moves: hasJumped === true ? newMoves[0] : [],
            jumpKills: hasJumped === true ? newMoves[1] : null,
            hasJumped: hasJumped === true ? player : null,
            stepNumber: this.state.history.length,
            winner: this.evaluateWinner(mostRecentBoardState),
        });
    }

    shouldKing(movingPiece, coordinates) {

        if (movingPiece.isKing === true) {
            return false;
        }

        const row = utils.getRowAsInt(coordinates);
        const player = movingPiece.player;

        return ( (row === 1 && player === 'player1') || (row === 8 && player === 'player2') );
    }

    evaluateWinner(boardState) {

        let player1Pieces = 0;
        let player1Moves  = 0;

        let player2Pieces = 0;
        let player2Moves  = 0;

        for (let coordinates in boardState) {
            if (!boardState.hasOwnProperty(coordinates) || boardState[coordinates] === null) {
                continue;
            }

            const movesData = this.getMoves(boardState, coordinates, boardState[coordinates].isKing, false);
            const moveCount = movesData[0].length;

            if (boardState[coordinates].player === 'player1') {
                ++player1Pieces;
                player1Moves += moveCount;

            } else {
                ++player2Pieces;
                player2Moves += moveCount;
            }
        }

        if (player1Pieces === 0 ) {
            return 'player2pieces';
        }

        if (player2Pieces === 0 ) {
            return 'player1pieces';
        }

        if (player1Moves === 0) {
            return 'player2moves';
        }

        if (player2Moves === 0) {
            return 'player1moves';
        }

        return null;
    }

    handleClick(coordinates) {

        if (this.state.winner !== null) {
            return;
        }

        const currentState = this.getCurrentState();
        const boardState = currentState.boardState;
        const clickedSquare = boardState[coordinates];

        if (clickedSquare !== null) {

            // Can't select opponents pieces
            if (clickedSquare.player !== utils.returnPlayerName(currentState.currentPlayer)) {
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

            // Can't choose a new piece if player has already jumped.
            if (this.state.hasJumped !== null && boardState[coordinates] !== null) {
                return;
            }

            // Set active piece
            //let movesData = this.getMoves(boardState, coordinates, clickedSquare.isKing, false);
            let movesData = this.ReactCheckers.getMoves(boardState, coordinates, clickedSquare.isKing, false);

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
            //this.movePiece(coordinates);

            const postMoveState = this.ReactCheckers.movePiece(coordinates, this.state);

            this.setState({
                history: this.state.history.concat([{
                    boardState: postMoveState.boardState,
                    currentPlayer: postMoveState.currentPlayer,
                }]),
                activePiece: postMoveState.activePiece,
                moves: postMoveState.moves,
                jumpKills: postMoveState.jumpKills,
                hasJumped: postMoveState.hasJumped,
                stepNumber: this.state.history.length,
                winner: postMoveState.winner,
            });
        }
    }

    undo() {
        const backStep = parseInt(this.state.stepNumber, 10) -1;
        if (backStep < 0) {
            return;
        }
        const unsetHistory = this.state.history.slice(0, backStep+1);
        this.setState({
            history: unsetHistory,
            activePiece: null,
            moves: [],
            jumpKills: null,
            hasJumped: null,
            stepNumber: backStep,
            winner: null,
        });
    }

    render() {

        console.log(this.state);

        const columns = this.columns;
        const stateHistory = this.state.history;
        const activePiece = this.state.activePiece;
        const currentState = stateHistory[this.state.stepNumber];
        const boardState = currentState.boardState;
        const currentPlayer = currentState.currentPlayer;
        const moves = this.state.moves;

        let gameStatus;

        let undoClass = 'undo';

        if (this.state.stepNumber < 1) {
            undoClass += ' disabled';
        }

        switch (this.state.winner) {
            case 'player1pieces':
                gameStatus = 'Player One Wins!';
                break;
            case 'player2pieces':
                gameStatus = 'Player Two Wins!';
                break;
            case 'player1moves':
                gameStatus = 'No moves left - Player One Wins!';
                break;
            case 'player2moves':
                gameStatus = 'No moves left - Player Two Wins!';
                break;
            default:
                gameStatus = currentState.currentPlayer === true ? 'Player One' : 'Player Two';
                break;
        }

        return(
            <Router history={browserHistory} basename={'react-checkers'} >
                <div className="reactCheckers">
                    <div className="game-status">
                        {gameStatus}
                    </div>
                    <div className="game-board">
                        <Board
                            boardState = {boardState}
                            currentPlayer = {currentPlayer}
                            activePiece = {activePiece}
                            moves = {moves}
                            columns = {columns}
                            onClick = {(coordinates) => this.handleClick(coordinates)}
                        />
                    </div>
                    <div className="time-travel">
                        <button className={undoClass} onClick={()=>this.undo()}>Undo</button>
                    </div>
                </div>
            </Router>
        );
    }
}

// ========================================

ReactDOM.render(
    <Game />,
    document.getElementById('root')
);