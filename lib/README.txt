How to use:

validator([handToBeat], [handPlayedByPlayer], declaredCard) ---> returns true if handPlayedByPlayer beats handToBeat, false otherwise

for example

validator([new Card("D", 3), new Card("D", 3)], [new Card("D", 7), new Card("D", 7)], new Card("S", 2)) -> true
	// pair of Diamonds 7s beats a pair of Diamond 3s


===========================
Notes
===========================

- for the following, assume that the format is always handToBeat vs handPlayedByPlayer respectively...

- (should) work for all valid hands

	- singles (obviously)

	- doubles (obviously)

	- trumping (i.e. 2 of Trump vs K of non-Trump): trump correctly wins

	- ties (i.e. A of Diamonds vs A of Diamonds): ties correctly go to person who led (AKA returns false)

	- tractors (i.e. 5-5-6-6 vs 4-4-3-3): the higher tractor wins

	- tractors vs 2 pairs of consecutive cards (i.e. 6-6-7-7 vs J-J-K-K): 6-6-7-7 correctly beats J-J-K-K

	- multi-formed hands (i.e. J-J-Q vs 6-6-9): J-J-Q correctly wins, but this does NOT check for validity from other hands; in other
		words, if someone else plays 3-3-K, the code will incorrectly believe the 3-3-K is higher than the J-J-Q, but this is
		the fault of the player who led J-J-Q for playing incorrectly this hand was beatable by other ppl, not the code's fault

	- garbage hands type A (i.e. 8-8 vs 9-10): 8-8 correctly beats 9-10

	- garbage hands type B (i.e. 7-7 of Spades vs K-K of Diamonds): correctly sees K-K does not match suit of 7-7, and so 7-7 wins

	...

- TL;DR IN GENERAL:

	- anytime the form of the two hands aren't identical, the person who led wins

	- anytime the handPlayedByPlayer has multiple suits in their played hand, the person who led wins

	- anytime the two suits don't match (except when one of them is trump, obviously), the person who led wins
