# Suggested workflow for writing down new movelist

1. You are going to alt-tab alot, so set the game to windowed mode
2. Go in free training mode and open up character command list
3. For every entry in the command list, write down every move's input, height and type, and context (if there is one). You can do so using the "*Summary*" field. Feel free to ignore tracking property at this point, as it's hard to be sure if a move is tracking just from the command list. You will be mostly entering stuff like `p hp` (**h**igh **p**unch on pressing "p"), `6p mp` (**m**id **p**unch on forward+p), `k hk`, `2k lk` (**l**ow **k**ick) etc.  
Use braces (`(`, `)`) for charging input (e.g. `6(P)`). Note that in most cases the key you really need to hold is not a direction key.  
What command list shows as `PP(2)K` (black arrow downwards) is actually `P`, `P`, `2K`, `2K`  
Pay attention to `P+K` -- that is not always only punch!  
You can blur focus with `[Enter]` and hit `+` to create new node if you aren't using placeholders  
If you saved/loaded during this step, you can add new nodes either to grouping node (`<punches>`), or to the stance node. In either case on next reload they will be located where they belong.
4.  Next step is optional, to turn on movelist in fightscreen info and go through all nodes you've entered to make sure you've entered everything that game shows you (not all moves show up in the command list). Unfortunately, even this movelist does not always show all moves/transitions possible (for example, Christie's `3K 2P+K`)
5. Set opponent to "Block all" mode, turn on move details in fightscreen info, and going through all nodes you've entered. Make one move, enter frame data, tracking, check other action step properties (and enter (dis)advantage -- coming soon)  
So if you have string `PP6P`, enter data for `P`, `PP` and finally `PP6P`  
Entering frame data doesn't require entering braces, they are in example just to make clear what is that field for.

## Stance vs context

Running is stance. Backturn is context. Your crouching is likely to be a stance. Sidestep is stance. Wall behind is context. Opponent next to wall / backturn / crouch is context