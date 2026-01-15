namespace $ {
	export class $apxu_samosbor_map extends $giper_baza_dict.with( {
		Gigacluster: $giper_baza_atom_link_to( () => $apxu_samosbor_map_gigacluster ),
		Version: $giper_baza_atom_text,
		Roles: $giper_baza_atom_link_to( () => $apxu_samosbor_map_role_infos )
	} ) {
		@$mol_mem
		roles() {
			return this.Roles( true )?.ensure( [ [ null, $giper_baza_rank_read ] ] ) ?? new $apxu_samosbor_map_role_infos
		}
		@$mol_mem
		gigacluster() {
			const gigacluster = this.Gigacluster( null )?.ensure( [ [ null, $giper_baza_rank_make( "read", "just" ) ] ] ) // just join
			gigacluster!.create_block = () => this.create_block()
			const can_rule = gigacluster?.land().lord_rank( $giper_baza_auth.current().pass().lord() ) == $giper_baza_rank_rule
			const roles = this.roles()
			if( can_rule ) {
				const cartographers_preset = roles.preset_no_current( "cartographer" )
				console.log( cartographers_preset )
				cartographers_preset.map( ( [ key, rank ] ) => {
					const lord = $giper_baza_auth.from( key!.toString() ).pass().lord()
					if( gigacluster.land().lord_pass( lord ) )
						gigacluster.land().lord_rank( lord, rank )
				} )
			}

			return gigacluster
		}
		@$mol_action
		create_block() {
			const roles = this.roles()
			const researchers_preset = roles.preset_no_current( "researcher" )
			const current_auth = $giper_baza_auth.current()
			const block = this.gigacluster()?.Blocks( true )?.make( [ ...( researchers_preset ), [ null, $giper_baza_rank_read ] ] ) // { ...researchers_preset, '': $giper_baza_rank_join( "just" ) }
			console.log( "created", block )
			return block!
		}
		@$mol_mem
		blocks() {
			const gigacluster = this.gigacluster()
			const blocks = gigacluster?.blocks()
			const roles = this.roles()
			const researchers_preset = roles.preset_no_current( "researcher" ).filter( ( [ pass ] ) => pass?.toString() !== roles.ruler_key() )
			blocks?.map( ( block ) => {
				const land = block.land()
				const can_rule = land.lord_rank( $giper_baza_auth.current().pass().lord() ) == $giper_baza_rank_rule
				if( can_rule ) {
					researchers_preset.map( ( [ pass, rank ] ) => {
						const is_owner = land.link().toString() == pass!.lord().toString()
						if( !is_owner ) {
							land.lord_rank( pass!.lord(), rank )
						}
					} )
				}
			} )

			return blocks
		}

		@$mol_action
		save() {
			const data = {
				blocks: {} as any
			}
			const blocks = $apxu_samosbor_map_storage.current()?.blocks() ?? []
			const normal_keys = [
				"direction", "block_type", "generator_floor",
				"left_flight_status", "left_flight_type", "right_flight_status",
				"right_flight_type", "middle_flight_type",
				"name", "pos_x", "pos_y",
				"layer", "min_floor", "max_floor"
			] as ( keyof typeof blocks[ 0 ] )[]
			const bigint_keys = [ "board_floor", "flood_floor", "roof_floor", "mail_floor" ]
			for( const block of blocks ) {
				const block_data = {} as { [ key: string ]: any }
				for( const key of normal_keys as string[] ) {
					block_data[ key ] = ( block as any )[ key ]()
				}
				block_data.is_pipe = block.IsPipe()?.val()
				block_data.IsMiddleFlight = block.IsMiddleFlight()?.val()
				for( const key of bigint_keys ) {
					const big_value = ( block as any )[ key ]()
					block_data[ key ] = big_value !== null ? Number( big_value ) : null
				}
				const floors_data = {} as any
				for( let floor = block.min_floor(); floor < block.max_floor(); floor++ ) {
					const floor_data = block.FloorsData()?.key( floor )
					const floor_saved_data = {} as any
					if( floor_data ) {
						for( const passage_key in PassageDirections ) {
							const type = floor_data[ passage_key as "UpLeftPassage" ]()?.Type()?.val()
							floor_saved_data[ passage_key ] = type
						}
						const fence = floor_data.Fence()?.val()
						floor_saved_data.fence = fence
						const left_flight = floor_data.LeftFlight()?.val()
						const right_flight = floor_data.RightFlight()?.val()
						const is_double = floor_data.IsDouble()?.val()
						floor_saved_data.left_flight = left_flight
						floor_saved_data.right_flight = right_flight
						floor_saved_data.is_double = is_double
					}


					floors_data[ floor ] = floor_saved_data
				}
				block_data.floors_data = floors_data
				block_data.transitions = block.transitions().map( ( transition ) => {
					const save_port = ( port: TransitionPort | null ) => {
						const block_ref = port?.Block()?.val()
						const block = block_ref ? $giper_baza_glob.Node( block_ref, $apxu_samosbor_map_block_data ) : null
						return {
							block: block?.name(),
							floor: port?.Floor()?.val(),
							position: port?.Position()?.val()
						}
					}
					return {
						from: save_port( transition.From() ),
						to: save_port( transition.To() )
					}
				} )

				data.blocks[ block.link().toString() ] = block_data
			}

			return data
		}
	}
}
