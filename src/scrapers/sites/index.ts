/**
 * Site-specific scrapers
 *
 * This file exports all scraper classes and provides a SCRAPER_REGISTRY
 * that maps hostnames to their corresponding scraper classes.
 */

import type { ScraperConstructor } from "../../types/scraper";

import { AllRecipesScraper } from "./allrecipes";
import { AllTheHealthyThingsScraper } from "./allthehealthythings";
import { AltonBrownScraper } from "./altonbrown";
import { AmbitiousKitchenScraper } from "./ambitiouskitchen";
import { AmericasTestKitchenScraper } from "./americastestkitchen";
import { AverieCooksScraper } from "./averiecooks";
import { BakerByNatureScraper } from "./bakerbynature";
import { BBCGoodFoodScraper } from "./bbcgoodfood";
import { BellyFullScraper } from "./bellyfull";
import { BettyCrockerScraper } from "./bettycrocker";
import { BonAppetitScraper } from "./bonappetit";
import { BudgetBytesScraper } from "./budgetbytes";
import { CafeDelitesScraper } from "./cafedelites";
import { ClosetCookingScraper } from "./closetcooking";
import { CookieAndKateScraper } from "./cookieandkate";
import { CookingLightScraper } from "./cookinglight";
import { CountryLivingScraper } from "./countryliving";
import { CulinaryHillScraper } from "./culinaryhill";
import { DamnDeliciousScraper } from "./damndelicious";
import { DelishScraper } from "./delish";
import { DinnerAtTheZooScraper } from "./dinneratthezoo";
import { DinnerThenDessertScraper } from "./dinnerthendessert";
import { EatingBirdFoodScraper } from "./eatingbirdfood";
import { EatingWellScraper } from "./eatingwell";
import { EpicuriousScraper } from "./epicurious";
import { FarmToJarScraper } from "./farmtojar";
import { FeastingAtHomeScraper } from "./feastingathome";
import { FifteenGramScraper } from "./fifteengram";
import { FifteenSpatulasScraper } from "./fifteenspatulas";
import { FineDiningLoversScraper } from "./finedininglovers";
import { Food52Scraper } from "./food52";
import { FoodAndWineScraper } from "./foodandwine";
import { FoodNetworkScraper } from "./foodnetwork";
import { FortyApronsScraper } from "./fortyaprons";
import { GimmeSomeOvenScraper } from "./gimmesomeoven";
import { HalfBakedHarvestScraper } from "./halfbakedharvest";
import { JamieOliverScraper } from "./jamieoliver";
import { JoshuaWeissmanScraper } from "./joshuaweissman";
import { JustATasteScraper } from "./justataste";
import { JustBentoScraper } from "./justbento";
import { MarthaStewartScraper } from "./marthastewart";
import { MinimalistbakerScraper } from "./minimalistbaker";
import { MyBakingAddictionScraper } from "./mybakingaddiction";
import { OneHundredOneCookBooksScraper } from "./onehundredonecookbooks";
import { PinchOfYumScraper } from "./pinchofyum";
import { RecipeTinEatsScraper } from "./recipetineats";
import { SallysBakingAddictionScraper } from "./sallysbakingaddiction";
import { SeriousEatsScraper } from "./seriouseats";
import { SimplyRecipesScraper } from "./simplyrecipes";
import { SkinnyTasteScraper } from "./skinnytaste";
import { SouthernLivingScraper } from "./southernliving";
import { TasteOfHomeScraper } from "./tasteofhome";
import { TastyScraper } from "./tasty";
import { TheKitchnScraper } from "./thekitchn";
import { ThePioneerWomanScraper } from "./thepioneerwoman";
import { TheRecipeCriticScraper } from "./therecipecritic";
import { ThreeSixFiveDaysOfBakingAndMoreScraper } from "./threesixfivedaysofbakingandmore";
import { TwentyFourKitchenScraper } from "./twentyfourkitchen";

export {
	AllRecipesScraper,
	AllTheHealthyThingsScraper,
	AltonBrownScraper,
	AmbitiousKitchenScraper,
	AmericasTestKitchenScraper,
	AverieCooksScraper,
	BakerByNatureScraper,
	BBCGoodFoodScraper,
	BellyFullScraper,
	BettyCrockerScraper,
	BonAppetitScraper,
	BudgetBytesScraper,
	CafeDelitesScraper,
	ClosetCookingScraper,
	CookieAndKateScraper,
	CookingLightScraper,
	CountryLivingScraper,
	CulinaryHillScraper,
	DamnDeliciousScraper,
	DelishScraper,
	DinnerAtTheZooScraper,
	DinnerThenDessertScraper,
	EatingBirdFoodScraper,
	EatingWellScraper,
	EpicuriousScraper,
	FarmToJarScraper,
	FeastingAtHomeScraper,
	FifteenGramScraper,
	FifteenSpatulasScraper,
	FineDiningLoversScraper,
	Food52Scraper,
	FoodAndWineScraper,
	FoodNetworkScraper,
	FortyApronsScraper,
	GimmeSomeOvenScraper,
	HalfBakedHarvestScraper,
	JamieOliverScraper,
	JoshuaWeissmanScraper,
	JustATasteScraper,
	JustBentoScraper,
	MarthaStewartScraper,
	MinimalistbakerScraper,
	MyBakingAddictionScraper,
	OneHundredOneCookBooksScraper,
	PinchOfYumScraper,
	RecipeTinEatsScraper,
	SallysBakingAddictionScraper,
	SeriousEatsScraper,
	SimplyRecipesScraper,
	SkinnyTasteScraper,
	SouthernLivingScraper,
	TasteOfHomeScraper,
	TastyScraper,
	TheKitchnScraper,
	ThePioneerWomanScraper,
	TheRecipeCriticScraper,
	ThreeSixFiveDaysOfBakingAndMoreScraper,
	TwentyFourKitchenScraper,
};

export const SCRAPER_REGISTRY: Record<string, ScraperConstructor> = {
	"101cookbooks.com": OneHundredOneCookBooksScraper,
	"15gram.be": FifteenGramScraper,
	"24kitchen.nl": TwentyFourKitchenScraper,
	"365daysofbakingandmore.com": ThreeSixFiveDaysOfBakingAndMoreScraper,
	"40aprons.com": FortyApronsScraper,
	"allrecipes.com": AllRecipesScraper,
	"allthehealthythings.com": AllTheHealthyThingsScraper,
	"altonbrown.com": AltonBrownScraper,
	"ambitiouskitchen.com": AmbitiousKitchenScraper,
	"americastestkitchen.com": AmericasTestKitchenScraper,
	"averiecooks.com": AverieCooksScraper,
	"bakerbynature.com": BakerByNatureScraper,
	"bbcgoodfood.com": BBCGoodFoodScraper,
	"bellyfull.net": BellyFullScraper,
	"bettycrocker.com": BettyCrockerScraper,
	"bonappetit.com": BonAppetitScraper,
	"budgetbytes.com": BudgetBytesScraper,
	"cafedelites.com": CafeDelitesScraper,
	"closetcooking.com": ClosetCookingScraper,
	"cookieandkate.com": CookieAndKateScraper,
	"cookinglight.com": CookingLightScraper,
	"countryliving.com": CountryLivingScraper,
	"culinaryhill.com": CulinaryHillScraper,
	"damndelicious.net": DamnDeliciousScraper,
	"delish.com": DelishScraper,
	"dinneratthezoo.com": DinnerAtTheZooScraper,
	"dinnerthendessert.com": DinnerThenDessertScraper,
	"eatingbirdfood.com": EatingBirdFoodScraper,
	"eatingwell.com": EatingWellScraper,
	"epicurious.com": EpicuriousScraper,
	"farmtojar.com": FarmToJarScraper,
	"feastingathome.com": FeastingAtHomeScraper,
	"fifteenspatulas.com": FifteenSpatulasScraper,
	"finedininglovers.com": FineDiningLoversScraper,
	"food52.com": Food52Scraper,
	"foodandwine.com": FoodAndWineScraper,
	"foodnetwork.co.uk": FoodNetworkScraper,
	"gimmesomeoven.com": GimmeSomeOvenScraper,
	"halfbakedharvest.com": HalfBakedHarvestScraper,
	"jamieoliver.com": JamieOliverScraper,
	"joshuaweissman.com": JoshuaWeissmanScraper,
	"justataste.com": JustATasteScraper,
	"justbento.com": JustBentoScraper,
	"marthastewart.com": MarthaStewartScraper,
	"minimalistbaker.com": MinimalistbakerScraper,
	"mybakingaddiction.com": MyBakingAddictionScraper,
	"pinchofyum.com": PinchOfYumScraper,
	"recipetineats.com": RecipeTinEatsScraper,
	"sallysbakingaddiction.com": SallysBakingAddictionScraper,
	"seriouseats.com": SeriousEatsScraper,
	"simplyrecipes.com": SimplyRecipesScraper,
	"skinnytaste.com": SkinnyTasteScraper,
	"southernliving.com": SouthernLivingScraper,
	"tasteofhome.com": TasteOfHomeScraper,
	"tasty.co": TastyScraper,
	"thekitchn.com": TheKitchnScraper,
	"thepioneerwoman.com": ThePioneerWomanScraper,
	"therecipecritic.com": TheRecipeCriticScraper,
};
