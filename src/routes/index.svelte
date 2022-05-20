<script context="module" lang="ts">
	export const prerender = true;
</script>

<script lang="ts">
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Hans Hofner" />
</svelte:head>

<section>
	<h1>
		They call me <span class="name"
			><div class="humans">H</div>
			<div class="are">a</div>
			<div class="not">n</div>
			<div class="special">s</div></span
		>
	</h1>
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

	@keyframes move_h {
		to {
			transform: translateY(-10px);
		}
	}
</style>
