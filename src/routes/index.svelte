<script lang="ts">
	import Card from '$lib/Card.svelte';
	import { fade } from 'svelte/transition';

	let flipped = false;
	const cardToRender: 'about' | 'contact' | undefined = undefined;

	const handleToggle = () => (flipped = !flipped);
	const handleTestToggle = () => (testBool = !testBool);

	const aboutCharacters = Array.from('About');
	const contactCharacters = Array.from('Contact');
	const blogCharacters = Array.from('Blog');
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Hans Hofner" />
</svelte:head>

<section on:click={handleTestToggle}>
	<h1>
		They call me <span class="name">
			<div class="humans">H</div>
			<div class="are">a</div>
			<div class="not">n</div>
			<div class="special">s</div>
		</span>
	</h1>
	{#if flipped}
		<Card handleClick={handleToggle}>
			<p>
				I am a motivated software engineer that loves intuitive UIs and those small little things
				that make applications that much better.
			</p>
			<p>I work with the following tech:</p>
			<ul>
				<li>React</li>
				<li>Svelte</li>
				<li>Python</li>
				<li>AWS</li>
			</ul>
		</Card>
	{:else}
		<div class="links">
			<a style:color="#ba82ae" on:click={handleToggle}>
				{#each aboutCharacters as character}
					<span style="--rotate-var: 45deg">{character}</span>
				{/each}
			</a>
			<a style:color="#9482ba" href="https://blog.hhofner.com">
				{#each blogCharacters as character}
					<span class="letsGo">{character}</span>
				{/each}
			</a>
			<a style:color="#82baad" class="contact">
				{#each contactCharacters as character}
					<span class="letsGo">{character}</span>
				{/each}
			</a>
		</div>
	{/if}
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 1;
	}

	h1 {
		width: 100%;
		font-size: 5rem;
	}

	a {
		display: flex;
		transition: letter-spacing 0.1s ease-out, transform 0.1s ease;
	}

	a:hover {
		letter-spacing: 0.5rem;
		transform: translateY(-0.5rem);
		--rotate-var: 45deg;
	}

	a > span:hover {
		transform: rotate(45deg);
	}

	a > span {
		transition: transform 0.4s ease;
	}

	ul,
	p {
		font-size: 1.5rem;
	}

	.links {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 1;
	}

	.name {
		font-family: Reglisse;
		font-size: 7rem;
	}

	.humans {
		display: inline-block;
		transform: rotate(5deg);
		animation: 2s linear 0s infinite alternate move_h;
	}

	.are {
		display: inline-block;
		transform: rotate(-3deg);
		animation: 2s linear 0.5s infinite alternate move_h;
	}

	.not {
		display: inline-block;
		transform: rotate(1deg);
		animation: 2s linear 1s infinite alternate move_h;
	}

	.special {
		display: inline-block;
		transform: rotate(-8deg);
		animation: 2s ease-in 1.5s infinite alternate move_h;
	}
	span {
		display: block;
	}
	h1 {
		margin-top: 0.2rem;
		flex-direction: column;
	}

	@keyframes move_h {
		to {
			transform: translateY(-10px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		@keyframes move_h {
		}
	}
</style>
