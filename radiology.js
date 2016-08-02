var example = [
{"term":"a", "types":[
	{"term":"america", "types":[
		{"term":"american idol", "types":[
			{"term":"american idol winner", "types":[]},
			{"term":"american idol loser", "types":[]}
			]
		},
		{"term":"american pie", "types":[
			{"term":"american pie 1", "types":[]},
			{"term":"american pie 2", "types":[
				{"term":"american pie 2 was a flop", "types":[]}
					]
				}
			]
		}
		]
	},
	{"term":"albania","types":[]}
	]
},
{"term":"b", "types":[]}
]


function runner()
{		
	var recursiveDescent = function(types, term){
		for (var t = 0; t < types.length; t++)
		{
			console.log(term+":"+types[t].term);
			recursiveDescent(types[t].types, term+":"+types[t].term);
		}
	};
	for (var t = 0; t < example.length; t++)
	{		
		var term = example[t].term;
		var types = example[t].types;
		recursiveDescent(types, term);
	}
}

console.log(example[0].term.length)
runner();