<script>
	export let handleClick;
</script>

<div on:click={handleClick}>
	<slot />
</div>

<style>
	div {
		padding: 1.5rem;
		border-radius: 15px;
		border: 3px solid;
		min-height: 100px;
		max-width: 350px;
		font-family: Arial;

		box-shadow: 5px 5px;
	}
</style>
