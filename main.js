// ? TODO better scripts menu
// TODO fullscreeen settings menu
// TODO better fabled tokens
// ? TODO pip layer clean up prompt delete
// TODO clean up saving and loading 
// * TODO fancify night widget
// * TODO higher player limit to include travellers

/**
 * Whether the application is loading. Set to true for the first few seconds
 * of application loading as data is synced from the server, or when loading
 * an uploaded gamestate from the grimoire. Saving is not possible while
 * loading is occuring.
 */
var loading = false;



/**
 * Load all non-JS files into the application to finish initialization.
 * This function is called as soon as the HTML is loaded.
 */
async function loaded()
{
  loading = true;

  base_roles = await get_JSON("tokens.json");
  roles = JSON.parse(JSON.stringify(base_roles));

  dragPipLayerSpawnDefault("good");
  dragPipLayerSpawnDefault("evil");
  dragPipLayerSpawnDefault("reminder_pip");
  
  initShroudTitle();

  load_scripts().then(() =>
  {
    load_game_state_json(localStorage.getItem("state"))
  })
  setTimeout(function ()
  {
    loading = false;
    player_count_change();
  }, 2000)
  document.getElementById("body_actual").setAttribute("orientation", getOrientation())
  window.onresize = resized;
}