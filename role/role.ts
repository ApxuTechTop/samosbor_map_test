namespace $ {



	export function bigint_to_rank( val: bigint | undefined | null, def?: typeof $giper_baza_rank.Value ): typeof $giper_baza_rank.Value {
		if( val == null ) {
			return def!
		}
		const num = Number( val )
		return num as typeof $giper_baza_rank.Value
	}
	export function rank_to_bigint( rank: typeof $giper_baza_rank.Value ) {
		return BigInt( rank )
	}

	export class $apxu_samosbor_map_role extends $giper_baza_atom_enum( [ "cartographer", "researcher", "traveler" ] ) {}

	export class $apxu_samosbor_map_role_right extends $giper_baza_dict.with( {
		Key: $giper_baza_atom_text,
		Description: $giper_baza_atom_text,
		Role: $apxu_samosbor_map_role,
	} ) {
		@$mol_mem
		key( next?: string ) {
			return this.Key( true )?.val( next ) ?? ""
		}
		@$mol_mem
		description( next?: string ) {
			return this.Description( true )?.val( next ) ?? ""
		}
		@$mol_mem
		role( next?: typeof $apxu_samosbor_map_role.options[ number ] ) {
			return this.Role( true )?.val( next ) ?? "no_role"
		}
	}

	// export class $apxu_samosbor_map_role extends $giper_baza_dict.with({
	// 	Rights: $giper_baza_dict_to($apxu_samosbor_map_role_right),
	// 	Default: $giper_baza_atom_int,
	// 	Ruler: $giper_baza_atom_str,
	// }) {
	// 	@$mol_mem
	// 	public_keys(next?: string[]) {
	// 		return next ?? this.Rights(true)?.keys() ?? []
	// 	}
	// 	@$mol_action
	// 	add_key() {}
	// 	// @$mol_mem
	// 	// ranks() {
	// 	// 	return this.public_keys().map((key) => {
	// 	// 		return this.rank(key as string)
	// 	// 	})
	// 	// }
	// 	@$mol_mem
	// 	rank() {
	// 		return $giper_baza_rank_join( "just" ) // TODO
	// 	}
	// 	// @$mol_mem_key
	// 	// rank(key: string, next?: typeof $giper_baza_rank.Value) {
	// 	// 	return bigint_to_rank(this.Rights(true)!.key(key)?.Rank(true)?.val(next && rank_to_bigint(next)), this.default_rank())
	// 	// }
	// 	@$mol_mem
	// 	ruler_key() {
	// 		return "my_key" // TODO
	// 	}
	// 	@$mol_mem
	// 	preset(ignore?: $giper_baza_auth) {
	// 		const mapped_ranks = (this.public_keys().reduce((acc: {[key: string]: typeof $giper_baza_rank.Value}, key) => {
	// 			acc[key as string] = this.rank()
	// 			return acc
	// 		}, {}))
	// 		return {
	// 			[this.ruler_key()]: $giper_baza_rank_rule,

	// 		}
	// 	}
	// }

	export class $apxu_samosbor_map_role_infos extends $giper_baza_dict.with( {
		Rights: $giper_baza_list_link_to( () => $apxu_samosbor_map_role_right ),
		Ruler: $giper_baza_atom_text,
	} ) {
		@$mol_mem
		get_rights() {
			return this.Rights( true )?.remote_list()
		}
		@$mol_mem
		ruler_key() {
			return this.Ruler( true )?.val() ?? $apxu_samosbor_map_app_my_public_key()
		}
		@$mol_action
		add_key( key: string ) {
			const new_rights = this.Rights( true )?.make( [ [ null, $giper_baza_rank_read ] ] )
			new_rights?.key( key )
			new_rights?.role( "researcher" )

			return new_rights
		}
		@$mol_mem_key
		lord_rights( key: string ) {
			const finded = this.get_rights()?.find( ( right ) => { return right.key() === key } )
			return finded
		}
		@$mol_mem_key
		lord_role( key: string, next?: typeof $apxu_samosbor_map_role.options[ number ] | "no_role" ) {
			const finded = this.lord_rights( key )
			if( next === "no_role" ) {
				if( finded ) {
					this.Rights( true )?.cut( finded.link() )
				}

				return "no_role"
			}
			return finded?.role( next )
		}

		rank_for_role( current_role: typeof $apxu_samosbor_map_role.options[ number ] | "no_role", needed_role: typeof $apxu_samosbor_map_role.options[ number ] ) {
			if( needed_role === "traveler" ) {
				return $giper_baza_rank_read
			}
			if( current_role === needed_role ) {
				return $giper_baza_rank_post( "just" )
			}
			if( current_role === "cartographer" && needed_role === "researcher" ) {
				return $giper_baza_rank_pull( "just" )
			}
			return $giper_baza_rank_read
		}

		@$mol_mem_key
		preset( role: typeof $apxu_samosbor_map_role.options[ number ] ) {
			const all_rights = this.get_rights()
			const preset: $giper_baza_rank_preset = []
			for( const right of all_rights ?? [] ) {
				preset.push( [ $giper_baza_auth_pass.from( right.key() ), this.rank_for_role( right.role(), role ) ] )
			}
			const ruler_pass = $giper_baza_auth_pass.from( this.ruler_key() )
			preset.push( [ ruler_pass, $giper_baza_rank_rule ] )
			return preset
		}
		@$mol_mem_key
		preset_no_current( role: typeof $apxu_samosbor_map_role.options[ number ] ) {
			const current_key = $giper_baza_auth.current().public().toString()
			const preset = this.preset( role ).filter( ( [ pass ] ) => {
				return pass?.toString() !== current_key
			} )
			console.log(preset)
			return preset
		}
	}
}
