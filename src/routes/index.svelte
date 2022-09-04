<svelte:head>
	<title>Home</title>
	<meta name="description" content="Hans Hofner" />
</svelte:head>

<section>
	<h1>Hans Hofner</h1>
	<div>
		<h2>About</h2>
		<p>Web developer looking to make functional and amazing software.</p>
		<br/>
		<p>I enjoy working with: React, Svelte, and Phoenix.</p>
		<br/>
		<div class="links">
		<a href="https://blog.hhofner.com">Read my blog</a>
		<a href="https://codepen.io/hhofner">View my CodePen</a>
		<a href="https://github.com/hhofner">Visit my GitHub</a>
	</div>
	</div>
	<div>
		<!-- TODO:  -->
		<h3>View my latest game</h3>
		<iframe src="https://lichess.org/embed/game/1bPuSBTb?theme=auto&bg=auto"
width=600 height=397 frameborder=0></iframe>
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
	}

</style>
