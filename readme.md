[Try it out](https://rawgit.com/AlexXsWx/DeadOrAliveMovelistVisualiser/master/src/index.html)

This tool is designed to write down movelist of a Dead or Alive 5 character in a well-structured way, so that it can be visualized for easier memorizing, and filtered to quickly find specific moves (e.g. all tracking moves, all moves with ground attack property etc) or setups (listing all combos that would land on specific frame).  
Due to complexity of some cases, this tool isn't planned to reconstruct the fighting mechanic in every single detail, although it will tend to do so.

Contributions are welcome.

Current data format has issues with supporting:
* Moves that can charge
* Moves with followup on condition (Akira's throw on guard break, Tina's throw on hit (K T), Christie's auto-throw on hit (3pp(p)p), Rig's throw on juggle)
* Move endings on condition (Alpha's floating stance on high punch Critical Burst)
* Ranged attacks (Raidou's fireball)
* Moves that can be canceled (Jacky's K H - I'm planning to solve this with followup frames property)
* Jump attack - there are two meanings, one is that offensive hold can't grab it, other is that counter hold would perform differently than on non-jump strike
