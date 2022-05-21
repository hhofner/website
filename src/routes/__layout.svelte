<script lang="ts">
	import Header from '$lib/header/Header.svelte';
	import '../app.css';
</script>

<Header />

<main>
	<slot />
</main>

<footer>
	<div>
		Made with SvelteKit and love. Font by <a href="https://youssef-habchi.com/">Youssef Habchi</a>
	</div>
</footer>

<style>
	main {
		background: rgb(241, 239, 227);
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		width: 100%;
		max-width: 1024px;
		margin: 0 auto;
		box-sizing: border-box;
	}

	footer {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 40px;
	}

	footer > div > a {
		font-size: 1rem;
		font-family: ReglisseFill;
		text-decoration: none;
		color: black;
	}

	@media (min-width: 480px) {
		footer {
			padding: 40px 0;
		}
	}
</style>
