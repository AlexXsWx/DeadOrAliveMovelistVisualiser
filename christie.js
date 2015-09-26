standing: {

	p: {

		p: {

			p: {
				p: {
					p: null,
					2p: null,
					links: [ jakeihoLinks ]
				}
			}

			2p: { p: null }
			4p: link(standing.4p),
			k: { k: null }

		},

		k: link(standing.k, without(standing.k.p))

	},

	4p: {
		p: { links: [ gatotsu ] }
		k: link(backStance.k, with({ p: null })),
		2k: link(backStance.2k),
		noInput: link(backStance)
	},

	k: {
		p: null,
		k: {
			k: null,
			2k: null,
			links: [ jakeihoLinks ]
		}
	}
}

backStance: {
	k: null
	2k: null
}

gatotsu: {
	_p: null,
	__p: {
		pause: { p: null }
	},
	_p2: jakeihoDown,
	_p8: jakeihoUp
}

jakeihoLinks: {
	2P+K: jakeihoUp,
	8P+K: jakeihoDown
}