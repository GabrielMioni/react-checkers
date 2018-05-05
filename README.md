# React Checkers

Playable version here: [http://www.gabrielmioni.com/react-checkers/](http://www.gabrielmioni.com/react-checkers/)

This is a 2 player checkers game built in React.js:

Features:
* Mobile friendly design
* Game board maintains state history and players can undo moves
* Untold hours of checkers based entertainment

### Playing
Human players take turns selecting piece from the board. Board squares are highlighted to show the player legal moves available for their selected piece.

A piece can be de-selected either by clicking on the already selected piece or just choosing another piece.

Players win either by:
- Jumping (and eliminating) all of the opponent's pieces.
- Making it impossible for them to move.

Once a player has committed to a jump they must take all available jumps. However starting a jump isn't required (this differs from checkers tournament rules, but that's not how I played when I was kid).

The rules are otherwise normal checkers. Kings are made by reaching the opponents side, multi-jumping is possible (and satisfying), you would probably rather play Nintendo -- but you can't for whatever reason. You're stuck with checkers.

### Code
The project was started using the NPM create-react-app

The game's business logic lives in the ReactCheckers component. The board is initialized as an object
where key values represent board coordinates.

Pieces for both players are stored as the values in the board object. Example: the value of ReactComponent.state.history[{boardState['a6']}] starts the game as a player1 piece object. When the piece moves, the value at boardState['a6'] in the new history array element will be null.

Each time a player moves (including multi-jumps, where the turn has not gone to the opponent), the game records the board's state. Moves can be undone by clicking the 'Undo' button in the lower right. This changes the value used to reference the current board state used to render the game.

When a pieces is selected, available moves (including jumps) are passed to the game's state.

Victory conditions are checked each time a player ends their turn.
