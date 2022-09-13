<script>
	import { onMount } from 'svelte';

	var latestGame = '1bPuSBTb';
	$: gameSrc = `https://lichess.org/embed/game/${latestGame}?theme=auto&bg=auto`;
	onMount(async () => {
		fetch('https://lichess.org/api/user/throwawaycompiler/current-game', {
			method: 'GET',
			headers: {
				Accept: 'application/json'
			}
		})
			.then((response) => response.json())
			.then((data) => {
				if (data.id) {
					latestGame = data.id;
				}
			});
	});
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Hans Hofner" />
</svelte:head>

<section>
	<h1>Hans Hofner</h1>
	<div>
		<h2>About</h2>
		<p>Web developer looking to make functional and amazing software.</p>
		<br />
		<p>I enjoy working with: React, Svelte, and Phoenix.</p>
		<br />
		<div class="links">
			<a href="https://blog.hhofner.com">Read my blog</a>
			<a href="https://codepen.io/hhofner">View my CodePen</a>
			<a href="https://github.com/hhofner">Visit my GitHub</a>
		</div>
	</div>
	<div>
		<h3>View my latest <s>blunder</s> game</h3>
		<iframe
			src={gameSrc}
			width="600"
			height="397"
			frameborder="0"
			title="throwawaycompilers latest game"
		/>
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
