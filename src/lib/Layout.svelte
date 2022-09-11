<script>
	export let title;
</script>

<section>
	<h1>{title}</h1>
	<slot></slot>
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

	a {
		width: fit-content;
		text-decoration: none;
		color: inherit;

		border-bottom: 3px solid #dad4d6;
		transition: all 0.25s linear;
		position: relative;
	}

	/* Source: https://codepen.io/thelittleblacksmith/pen/zXNVvY  */
	a:before {
		content: '';
		display: block;
		width: 100%;
		height: 3px;
		background-color: #284b7a;
		position: absolute;
		left: 0;
		bottom: -3px; /* this is to match where the border is */
		transform-origin: left;
		transform: scale(0);
		transition: 0.25s linear;
	}
	a:hover:before {
		transform: scale(1);
	}

	.links {
		display: flex;
		flex-direction: column;
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
