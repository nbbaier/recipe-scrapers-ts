Detected Python command: uv run python
🔍 Comparing Python vs TypeScript Outputs

Domain: allrecipes.com
Test cases: 1

────────────────────────────────────────────────────────────
Test File: allrecipescurated.testhtml
────────────────────────────────────────────────────────────

📝 Running Python scraper...
✓ Python scraper completed

📝 Running TypeScript scraper...
✓ TypeScript scraper completed

❌ OUTPUTS DIFFER

Differences:
{
"author": "Michelle",
"canonical_url": "https://www.allrecipes.com/recipe/133948/four-cheese-margherita-pizza/",
"category": "Dinner",
"cook_time": 10,
"cuisine": "Italian Inspired",
"description": "These delicious four cheese pizzas are bursting with flavor, and ready in under one hour.",
"host": "allrecipes.com",
"image": "https://www.allrecipes.com/thmb/dA8YLuNy2HMa9s-tSTiFYjPdXy0=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/5225433-four-cheese-margherita-pizza-Christina-4x3-1-29b0fe4316b74017a5ae437e9ebb319d.jpg",
"ingredient_groups": [
{
"ingredients": [
"0.25 cup olive oil",
"1 tablespoon minced garlic",
"0.5 teaspoon sea salt",
"8 Roma tomatoes, sliced",
"2 (12 inch) pre-baked pizza crusts",
"8 ounces shredded Mozzarella cheese",
"4 ounces shredded Fontina cheese",
"10 fresh basil leaves, washed, dried",
"0.5 cup freshly grated Parmesan cheese",
"0.5 cup crumbled feta cheese"
],

-       "purpose": null
      }
   ],
   "ingredients": [
   "0.25 cup olive oil",
   "1 tablespoon minced garlic",
   "0.5 teaspoon sea salt",
   "8 Roma tomatoes, sliced",
   "2 (12 inch) pre-baked pizza crusts",
   "8 ounces shredded Mozzarella cheese",
   "4 ounces shredded Fontina cheese",
   "10 fresh basil leaves, washed, dried",
   "0.5 cup freshly grated Parmesan cheese",
   "0.5 cup crumbled feta cheese"
   ],
   "instructions": "Stir together olive oil, garlic, and salt; toss with tomatoes, and allow to stand for 15 minutes. Preheat oven to 400 degrees F (200 degrees C).\nBrush each pizza crust with some of the tomato marinade. Sprinkle the pizzas evenly with Mozzarella and Fontina cheeses. Arrange tomatoes overtop, then sprinkle with shredded basil, Parmesan, and feta cheese.\nBake in preheated oven until the cheese is bubbly and golden brown, about 10 minutes.",
   "instructions_list": [
   "Stir together olive oil, garlic, and salt; toss with tomatoes, and allow to stand for 15 minutes. Preheat oven to 400 degrees F (200 degrees C).",
   "Brush each pizza crust with some of the tomato marinade. Sprinkle the pizzas evenly with Mozzarella and Fontina cheeses. Arrange tomatoes overtop, then sprinkle with shredded basil, Parmesan, and feta cheese.",
   "Bake in preheated oven until the cheese is bubbly and golden brown, about 10 minutes."
   ],
   "language": "en",
   "nutrients": {
   "calories": "551 kcal",
   "carbohydrateContent": "54 g",
   "cholesterolContent": "58 mg",
   "fatContent": "26 g",
   "fiberContent": "3 g",
   "proteinContent": "29 g",
   "saturatedFatContent": "11 g",
   "sodiumContent": "1183 mg",
   "sugarContent": "5 g",
   "unsaturatedFatContent": "0 g"
   },
   "prep_time": 15,
   "ratings": 4.8,
   "ratings_count": 489,
   "site_name": "Allrecipes",
   "title": "Four Cheese Margherita Pizza",
   "total_time": 40,
   "yields": "8 servings"
   }

Field-by-Field Comparison:
────────────────────────────────────────────────────────────
✓ author
✓ canonical_url
✓ category
✓ cook_time
✓ cuisine
✓ description
✓ host
✓ image
✗ ingredient_groups
Python: [{"ingredients":["0.25 cup olive oil","1 tablespoon minced garlic","0.5 teaspoon sea salt","8 Roma tomatoes, sliced","2 (12 inch) pre-baked pizza crusts","8 ounces shredded Mozzarella cheese","4 ounces shredded Fontina cheese","10 fresh basil leaves, washed, dried","0.5 cup freshly grated Parmesan cheese","0.5 cup crumbled feta cheese"],"purpose":null}]
TypeScript: [{"ingredients":["0.25 cup olive oil","1 tablespoon minced garlic","0.5 teaspoon sea salt","8 Roma tomatoes, sliced","2 (12 inch) pre-baked pizza crusts","8 ounces shredded Mozzarella cheese","4 ounces shredded Fontina cheese","10 fresh basil leaves, washed, dried","0.5 cup freshly grated Parmesan cheese","0.5 cup crumbled feta cheese"]}]
✓ ingredients
✓ instructions
✓ instructions_list
✓ language
✗ nutrients
Python: {"calories":"551 kcal","carbohydrateContent":"54 g","cholesterolContent":"58 mg","fatContent":"26 g","fiberContent":"3 g","proteinContent":"29 g","saturatedFatContent":"11 g","sodiumContent":"1183 mg","sugarContent":"5 g","unsaturatedFatContent":"0 g"}
TypeScript: {"calories":"551 kcal","carbohydrateContent":"54 g","cholesterolContent":"58 mg","fiberContent":"3 g","proteinContent":"29 g","saturatedFatContent":"11 g","sodiumContent":"1183 mg","sugarContent":"5 g","fatContent":"26 g","unsaturatedFatContent":"0 g"}
✓ prep_time
✓ ratings
✓ ratings_count
✓ site_name
✓ title
✓ total_time
✓ yields
