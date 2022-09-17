<script>
	import ThreeStars from '../../lib/ThreeStars.svelte';
</script>

<section>
	<h1>Ruined By Design <ThreeStars /></h1>
	<div>
		<h2>ISBN: 9781090532084</h2>
		<div>
			<quote>
				The world is working exactly as designed. The combustion engine which is destroying our
				planet's atmosphere and rapidly making it inhospitable is working exactly as we designed it.
				Guns, which lead to so much death, work exactly as they're designed to work. And every time
				we "improve" their design, they get better at killing... The world is working exactly as
				designed.
			</quote>
			<p>
				I thought this book was interesting, it raised many valid arguments, highlighted a lot of
				examples of failed design, and written in an aggressive yet comical tone. However I didn't
				really learn much of what I didn't know already and felt that the book, like many, was more
				of a collection of blog rant posts. I still think this is good reading, especially for high
				execs and those in influential positions.
			</p>
		</div>
	</div>
</section>

<style>
	quote {
		opacity: 0.6;
		font-style: italic;
		text-indent: 0.5rem;
	}
	quote:before {
		content: '"';
		margin-right: 1rem;
	}
	quote:after {
		content: '"';
		margin-left: 1rem;
	}
	p {
		margin-top: 1rem;
	}

	section {
		display: grid;
		grid-template-columns: 2fr 1fr;
		grid-auto-rows: minmax(100px, auto);

		column-gap: 1rem;
	}

	h1 {
		grid-column: 1 / 3;
		grid-row: 1 / 2;

		text-align: left;
	}

	@media (max-width: 700px) {
		section {
			display: grid;
			grid-template-columns: 1fr;
		}

		div {
			margin-bottom: 1rem;
		}

		h1 {
			grid-column: 1;
		}
	}
</style>
