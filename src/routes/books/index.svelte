<script>
	import ThreeStars from '../../lib/ThreeStars.svelte';
</script>

<section>
	<h1>Book Reviews</h1>
	<div>
		<h2>Read</h2>
		<ul>
			<li><a href="/books/ruined-by-design">Ruined By Design </a></li>
		</ul>
	</div>
</section>

<style>
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

		iframe {
			width: 300px;
		}
	}
</style>
