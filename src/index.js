import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

class ReactCheckers extends React.Component {

    constructor(props) {
        super(props);

        this.columns = this.setColumns();

        this.state = {
            history: this.createBoard(),
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

        console.log(board);

        return board;
    }

    render() {
        return('');
    }
}

// ========================================

ReactDOM.render(
    <ReactCheckers />,
    document.getElementById('root')
);