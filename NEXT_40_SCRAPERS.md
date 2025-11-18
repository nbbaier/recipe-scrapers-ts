# Next 40 Scrapers to Port

Priority order based on:
1. Site popularity and traffic
2. Simplicity of implementation
3. Test data availability

## Batch 1: Very Popular Food Blogs (10 scrapers)
1. budgetbytes - Popular budget cooking
2. pinchofyum - Very popular food blog
3. minimalistbaker - Popular minimal ingredient recipes
4. skinnytaste - Popular healthy recipes
5. thekitchn - Popular cooking site
6. gimmesomeoven - Popular recipe blog
7. halfbakedharvest - Popular food blog
8. damndelicious - Popular easy recipes
9. cafedelites - Popular recipe blog
10. handletheheat - Popular baking blog

## Batch 2: Major Media & Established Sites (10 scrapers)
11. americastestkitchen - High quality recipes
12. food52 - Popular community site
13. eatingwell - Healthy recipes
14. kingarthurbaking - Very popular baking
15. mybakingaddiction - Popular baking blog
16. sallysbakingaddiction - Very popular baking
17. bettycrocker - Established brand
18. pillsbury - Major brand
19. marthastewart - Major media brand
20. foodandwine - Major media brand

## Batch 3: International & Specialty (10 scrapers)
21. bbc - Major BBC recipes
22. jamieoliver - Celebrity chef (UK)
23. nigelslater - Celebrity chef (UK)
24. recipetineats - Popular Australian blog
25. cookinglight - Healthy cooking
26. southernliving - Southern recipes
27. tasteofhome - Popular community site
28. countryliving - Lifestyle magazine
29. womansday - Lifestyle magazine
30. bhg - Better Homes & Gardens

## Batch 4: Popular Specialty Blogs (10 scrapers)
31. ambitiouskitchen - Healthy recipes
32. averiecooks - Popular food blog
33. bakerbynature - Baking blog
34. bellyfull - Comfort food blog
35. dinneratthezoo - Family meals
36. dinnerthendessert - Quick recipes
37. eatingbirdfood - Healthy recipes
38. feastingathome - Seasonal cooking
39. fifteenspatulas - Recipe blog
40. therecipecritic - Popular family recipes

---

## Command to migrate all 40:

```bash
bun scripts/migrate-scraper.ts --batch budgetbytes,pinchofyum,minimalistbaker,skinnytaste,thekitchn,gimmesomeoven,halfbakedharvest,damndelicious,cafedelites,handletheheat,americastestkitchen,food52,eatingwell,kingarthurbaking,mybakingaddiction,sallysbakingaddiction,bettycrocker,pillsbury,marthastewart,foodandwine,bbc,jamieoliver,nigelslater,recipetineats,cookinglight,southernliving,tasteofhome,countryliving,womansday,bhg,ambitiouskitchen,averiecooks,bakerbynature,bellyfull,dinneratthezoo,dinnerthendessert,eatingbirdfood,feastingathome,fifteenspatulas,therecipecritic
```

## Or migrate in smaller batches:

```bash
# Batch 1
bun scripts/migrate-scraper.ts --batch budgetbytes,pinchofyum,minimalistbaker,skinnytaste,thekitchn,gimmesomeoven,halfbakedharvest,damndelicious,cafedelites,handletheheat

# Batch 2
bun scripts/migrate-scraper.ts --batch americastestkitchen,food52,eatingwell,kingarthurbaking,mybakingaddiction,sallysbakingaddiction,bettycrocker,pillsbury,marthastewart,foodandwine

# Batch 3
bun scripts/migrate-scraper.ts --batch bbc,jamieoliver,nigelslater,recipetineats,cookinglight,southernliving,tasteofhome,countryliving,womansday,bhg

# Batch 4
bun scripts/migrate-scraper.ts --batch ambitiouskitchen,averiecooks,bakerbynature,bellyfull,dinneratthezoo,dinnerthendessert,eatingbirdfood,feastingathome,fifteenspatulas,therecipecritic
```
