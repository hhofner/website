<svelte:head>
	<title>Home</title>
	<meta name="description" content="Hans Hofner" />
</svelte:head>

<section>
	<h1>Hans Hofner</h1>
	<div>
		<p>
			Currently re-designing so it doesn't look like I made the website in a few hours. We (just me)
			apologize for the inconvenience.
		</p>
		<br />
		<p>
			You can reach me on
			<a href="https://twitter.com/flexgambit">Twitter</a>
			or when I'm not doing my work on
			<a href="https://lichess.org/@/throwawaycompiler">lichess.</a>
		</p>
	</div>
</section>

<style>
	section {
		display: flex;
		gap: 1rem;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 1;
	}

	div {
		background: white;
		min-height: 150px;

		padding: 1rem;

		font-size: 1.5rem;

		border: 8px solid;

		border-width: 10px;
		border-image: repeating-radial-gradient(circle at 10px, aqua, red 2px, yellow 4px, pink 2px) 1;
	}
</style>
