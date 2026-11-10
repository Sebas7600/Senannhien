import type {GameState,MealOrder} from './gameStore';

/** All observers choose the same room service timeline, including the ordering guest. */
export function roomServiceMeal(state:Pick<GameState,'roomSync'|'roomMeals'|'meal'>,now=Date.now()):MealOrder|null{
 const meals=state.roomSync?state.roomMeals:state.meal?[state.meal]:[];
 return meals.filter(meal=>meal.orderedAt!==undefined&&meal.orderedAt<=now&&(meal.homeAt??meal.readyAt)>now)
  .sort((a,b)=>(a.orderedAt??0)-(b.orderedAt??0)||a.seatId.localeCompare(b.seatId))[0]??null;
}
