set game to windowed mode in smallest resolution possible
go in training
Open up character command list
Use move summary to enter input, height and type, and context (if there is one).
    Feel free to ignore tracking at this point, as it's hard to predict it.
    You will be mostly entering stuff like "p hp", "6p mp", "k hk", "2k lk" etc
    (Input is automatically converted to upper case, you don't have to hold shift / turn on caps lock)
    Use braces ("(", ")") for charging input (e.g. "6(P)"). Note that in most cases the key you really need to hold is not a direction key.
    Splitting string "pp(2)kk" actually produces 4 inputs: "p", "p", "2k", "2k"
    Pay attention to p+k - that is not always only punch!

    You can blur focus with "enter" and hit "+" to create new node if you aren't using placeholders

    If you saved/loaded during this step, you can add new nodes either to grouping node ("<punches>"), or to the stance node. In either case on next reload they will be located where they belong.

Keep in mind the game doesn't always show all possible moves

Running is stance. Backturn is context. Your crouching is likely to be a stance. Sidestep is stance. Wall behind is context. Opponent next to wall / backturn / crouch is context

Next step is optional, to turn on movelist in fightscreen info and go through all nodes you've entered to make sure you've entered everything that game shows you (not all moves show up in movelist)

Next step is set opponent to blocking,  turning on move details in fightscreen info, and going through all nodes you've entered again.
Make one move, enter frame data, tracking, check other action step properties (and enter (dis)advantage - coming soon)
    So if you have string "pp6p", enter data for "p", "pp" and finally "pp6p"
    Entering frame data doesn't require entering braces, they are in example just to make clear what is that field for.