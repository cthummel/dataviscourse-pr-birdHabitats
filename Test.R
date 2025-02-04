library(ebirdst)
library(raster)
library(velox)
library(sf)
library(smoothr)
library(rnaturalearth)
library(dplyr)
library(tidyr)
library(stringr)
library(ggplot2)
library(geojsonio)
# resolve namespace conflicts
select <- dplyr::select
extract <- raster::extract


#Edit these to change what raster we produce
printDirectory = "~/dataVis/"
birdcode = "baleag"
birdCommonName = "Bald Eagle"






# download to a temp directory for the vigette
# in practice, change to permanent directory the status and trends downloads
sp_path <- ebirdst_download(species = birdcode)
# load the abundance data
# this automaticaaly labels layers with their dates
abd <- load_raster("abundance_umean", path = sp_path)

mollweide <- "+proj=moll +lon_0=-90 +x_0=0 +y_0=0 +ellps=WGS84"
ne_scale <- 50

# land polygon
ne_land <- ne_countries(scale = ne_scale, returnclass = "sf") %>%
  filter(continent %in% c("North America", "South America")) %>%
  st_set_precision(1e6) %>%
  st_union() %>% 
  st_geometry()
# function to subset other features to those  within this land area
wh_subset <- function(x) {
  in_wh <- as.logical(st_intersects(x, ne_land, sparse = FALSE))
  st_transform(x[in_wh], crs = mollweide)}


# country lines
ne_country_lines <- ne_download(scale = ne_scale, category = "cultural",
                                type = "admin_0_boundary_lines_land",
                                returnclass = "sf") %>%
  st_geometry() %>%
  wh_subset()
# state lines
ne_state_lines <- ne_download(scale = ne_scale, category = "cultural",
                              type = "admin_1_states_provinces_lines",
                              returnclass = "sf") %>%
  st_geometry() %>%
  wh_subset()
# rivers
ne_rivers <- ne_download(scale = ne_scale, category = "physical",
                         type = "rivers_lake_centerlines",
                         returnclass = "sf") %>%
  st_geometry() %>%
  wh_subset()
# lakes
ne_lakes <- ne_download(scale = ne_scale, category = "physical",
                        type = "lakes",
                        returnclass = "sf") %>%
  st_geometry() %>%
  wh_subset()
ne_land <- st_transform(ne_land, crs = mollweide)



# subset to the yellow-bellied sapsucker season definitions
bird_dates <- filter(ebirdst_runs, species_code == birdcode) %>% 
  # just keep the seasonal definition columns
  select(setdiff(matches("(start)|(end)"), matches("year_round"))) %>% 
  # transpose
  gather("label", "date") %>% 
  # spread data so start and end dates are in separate columns
  separate(label, c("season", "start_end"), "_(?=s|e)") %>% 
  spread(start_end, date) %>% 
  select(season, start_dt, end_dt)
# did the season pass review
bird_dates <- mutate(bird_dates, pass = !(is.na(start_dt) | is.na(end_dt)))
bird_dates

# dates for each abundance layer
weeks <- parse_raster_dates(abd)
# assign to seasons
weeks_season <- rep(NA_character_, length(weeks))
for (i in seq_len(nrow(bird_dates))) {
  s <- bird_dates[i, ]
  # skip seasona assignment if season failed
  if (!s$pass) {
    next()
  }
  # handle seasons cross jan 1 separately
  if (s$start_dt <= s$end_dt) {
    in_season <- weeks >= s$start_dt & weeks <= s$end_dt
  } else {
    in_season <- weeks >= s$start_dt | weeks <= s$end_dt
  }
  weeks_season[in_season] <- s$season
}
table(weeks_season)

# drop weeks not assigned to season
week_pass <- !is.na(weeks_season)
abd <- abd[[which(week_pass)]]
weeks <- weeks[week_pass]
weeks_season <- weeks_season[week_pass]
# average over weeks in season
mean_season <- function(s) {
  calc(abd[[which(weeks_season == s)]], mean, na.rm = TRUE)
}
seasons <- unique(weeks_season)
abd_season <- lapply(seasons, mean_season) %>% 
  stack() %>% 
  setNames(seasons)
abd_season

migration_threshold <- 0.4
mig_seasons <- c("prebreeding_migration", "postbreeding_migration")
if (all(mig_seasons %in% names(abd_season))) {
  # identify areas with abundance in only one season
  abd_nz <- abd_season[[mig_seasons]] > 0
  just_pre <- mask(abd_nz[["prebreeding_migration"]],
                   abd_nz[["postbreeding_migration"]], 
                   maskvalue = 1)
  just_post <- mask(abd_nz[["postbreeding_migration"]],
                    abd_nz[["prebreeding_migration"]], 
                    maskvalue = 1)
  # count the number of cells with abundance in only one season
  n_just <- cellStats(stack(just_pre, just_post), sum)
  n_all <- cellStats(abd_nz, sum)
  # is the proportion of one season cells above the 40% threshold
  split_migration <- max(n_just / n_all, na.rm = TRUE) >= migration_threshold
} else {
  split_migration <- FALSE
}
n_just / n_all
split_migration




threshold_yearround <- 0.01
# decide whether to show year-round layer
if (nlayers(abd_season) == 4) {
  # annual abundance
  abd_yr <- calc(abd, fun = mean, na.rm = TRUE)
  # mask out cells that aren't occupied year-round
  year_round <- calc(abd_season > 0, fun = sum, na.rm = TRUE) == 4
  abd_yr_mask <- mask(abd_yr, year_round, maskvalue = 0)
  # determine proportion of celss that are occupied year round
  n_yr <- cellStats(abd_yr_mask > 0, sum)
  n_an <- cellStats(abd_yr > 0, sum)
  # only show year round abundance if it's above 1% of range threshold
  show_yearround <- ((n_yr / n_an) >= threshold_yearround)
} else {
  show_yearround <- FALSE
}
show_yearround



bin_breaks <- calc_bins(abd_season)






# project the abundance data to mollweide
# use nearest neighbour resampling to preserve true zeros
abd_season_proj <- projectRaster(abd_season, crs = mollweide, method = "ngb")
# determine spatial extent for plotting
ext <- calc_full_extent(abd_season_proj)
# set the plotting order of the seasons
season_order <- c("postbreeding_migration", "prebreeding_migration", 
                  "nonbreeding", "breeding")

# prediction region, cells with predicted value in at least one week
pred_region <- calc(abd_season_proj, mean, na.rm = TRUE)
# mask to land area
ne_land_buffer <- st_buffer(ne_land, dist = max(res(pred_region)) / 2)
pred_region <- mask(pred_region, as_Spatial(ne_land_buffer))

# remove zeros from abundnace layers
abd_no_zero <- subs(abd_season_proj, data.frame(from = 0, to = NA), 
                    subsWithNA = FALSE)

# set up plot area
par(mar = c(0 , 0, 0, 0))
plot(ne_land, col = "#eeeeee", border = NA, #)
     xlim = c(ext@xmin, ext@xmax),
     ylim = c(ext@ymin, ext@ymax))
# prediction region and explicit zeros
plot(pred_region, col = "#dddddd", maxpixels = raster::ncell(pred_region),
     legend = FALSE, add = TRUE)
# lakes
plot(ne_lakes, col = "#ffffff", border =  "#444444", lwd = 0.5, add = TRUE)
# land border
plot(ne_land, col = NA, border = "#444444", lwd = 0.5, add = TRUE)
# seasonal layer
plot_seasons <- intersect(season_order, names(abd_no_zero))
for (s in plot_seasons) {
  # handle splitting of migration seasons into different colors
  if (!split_migration && s %in% c("prebreeding_migration", 
                                   "postbreeding_migration")) {
    pal_season <- "migration"
    
  } else {
    pal_season <- s
  }
  pal <- abundance_palette(length(bin_breaks$bins) - 1, pal_season)
  plot(abd_no_zero[[s]], col = pal, breaks = bin_breaks$bins,
       maxpixels = ncell(abd_no_zero[[s]]),
       legend = FALSE, add = TRUE)
}
# year round
if (show_yearround) {
  year_round_proj <- projectRaster(year_round, crs = mollweide, method = "ngb")
  plot(year_round_proj, 
       col = abundance_palette(length(bin_breaks$bins) - 1, "year_round"), 
       breaks = bin_breaks$bins,
       maxpixels = ncell(year_round_proj),
       legend = FALSE, add = TRUE)
}
# linework
plot(ne_rivers, col = "#ffffff", lwd = 0.75, add = TRUE)
plot(ne_state_lines, col = "#ffffff", lwd = 1.5, add = TRUE)
plot(ne_country_lines, col = "#ffffff", lwd = 2, add = TRUE)

# legends
legend_seasons <- plot_seasons
if (split_migration) {
  legend_seasons[legend_seasons %in% c("prebreeding_migration", 
                                       "postbreeding_migration")] <- "migration"
  legend_seasons <- unique(legend_seasons)
}
if (show_yearround) {
  legend_seasons <- c(legend_seasons, "year_round")
}
# thin out labels
lbl_at <- bin_breaks$bins^bin_breaks$power
lbl_at <- c(min(lbl_at), median(lbl_at), max(lbl_at))
lbl <- lbl_at^(1 / bin_breaks$power)
lbl <- format(round(lbl, 2), nsmall = 2)
# plot legends
for (i in seq_along(legend_seasons)) {
  pal <- abundance_palette(length(bin_breaks$bins) - 1, legend_seasons[i])
  if (i == 1) {
    axis_args <- list(at = lbl_at, labels = lbl, line = -1,
                      cex.axis = 0.75, lwd = 0)
  } else {
    axis_args <- list(at = lbl_at, labels = rep("", 3),
                      cex.axis = 0.75, lwd = 0)
  }
  legend_title <- legend_seasons[i] %>% 
    str_replace_all("_", " ") %>% 
    str_to_title()
  fields::image.plot(zlim = range(bin_breaks$bins^bin_breaks$power), 
                     legend.only = TRUE, 
                     breaks = bin_breaks$bins^bin_breaks$power, col = pal,
                     smallplot = c(0.05, 0.35, 0.01 + 0.06 * i, 0.03 + 0.06 * i),
                     horizontal = TRUE,
                     axis.args = axis_args,
                     legend.args = list(text = legend_title, side = 3, 
                                        cex = 0.9, col = "black", line = 0.1))
}
title(paste(birdCommonName, "Relative Abundance (birds per km/hr)", sep = " "), 
      line = -1, cex.main = 1)








# aggregate
abd_season_agg <- aggregate(abd_season_proj, fact = 3)
# raster to polygon, one season at a time
range <- list()
pred_area <- list()
for (s in names(abd_season_agg)) {
  # range
  range[[s]] <- rasterToPolygons(abd_season_agg[[s]], 
                                 fun = function(y) {y > 0}, 
                                 digits = 6) %>% 
    st_as_sfc() %>% 
    # combine polygon pieces into a single multipolygon
    st_set_precision(1e6) %>% 
    st_union() %>% 
    st_sf() %>% 
    # tag layers with season
    mutate(season = s, layer = "range")
  # prediction area
  pred_area[[s]] <- rasterToPolygons(abd_season_agg[[s]], 
                                     fun = function(y) {!is.na(y)}, 
                                     digits = 6) %>% 
    st_as_sfc() %>% 
    # combine polygon pieces into a single multipolygon
    st_set_precision(1e6) %>% 
    st_union() %>% 
    st_sf() %>% 
    # tag layers with season
    mutate(season = s, layer = "prediction_area")
}
# combine the sf objects for all seasons
range <- rbind(do.call(rbind, range), do.call(rbind, pred_area))
row.names(range) <- NULL
print(range)

# clean and smooth
cell_area <- (1.5 * prod(res(abd_season_agg)))
range_smooth <- range %>% 
  # drop fragment polygons smaller than 1.5 times the aggregated cell size
  drop_crumbs(threshold = cell_area) %>% 
  # drop holes in polygons smaller than 1.5 times the aggregated cell size
  fill_holes(threshold = cell_area) %>% 
  # smooth the polygon edges
  smooth(method = "ksmooth", smoothness = 2)
# clip zeros to land border, range to buffered land to handle coastal species
range_split <- split(range_smooth, range_smooth$layer)
range_smooth <- rbind(
  st_intersection(range_split$range, ne_land_buffer),
  st_intersection(range_split$prediction_area, ne_land))


# range map color palette
range_palette <- c(nonbreeding = "#1d6996",
                   prebreeding_migration = "#73af48",
                   breeding = "#cc503e",
                   postbreeding_migration = "#edad08",
                   migration = "#edad08",
                   year_round = "#6f4070")

# set up plot area
par(mar = c(0 , 0, 0, 0))
plot(ne_land, col = "#eeeeee", border = NA, 
     xlim = c(ext@xmin, ext@xmax),
     ylim = c(ext@ymin, ext@ymax))
# prediction region and explicit zeros
annual_pred_area <- filter(range_smooth, layer == "prediction_area") %>% 
  st_union()
plot(annual_pred_area, col = "#dddddd", border = NA, add = TRUE)
# lakes
plot(ne_lakes, col = "#ffffff", border =  "#444444", lwd = 0.5, add = TRUE)
# land border
plot(ne_land, col = NA, border = "#444444", lwd = 0.5, add = TRUE)
# seasonal layer
for (s in intersect(season_order, unique(range_smooth$season))) {
  # handle splitting of migration seasons into different colors
  if (!split_migration && s %in% c("prebreeding_migration", 
                                   "postbreeding_migration")) {
    col_season <- "migration"
  } else {
    col_season <- s
  }
  rng_season <- filter(range_smooth, season == s, layer == "range") %>% 
    st_geometry()
  plot(rng_season, col = range_palette[col_season], border = NA, add = TRUE)
}
# year round
if (show_yearround) {
  # find common area between all seasons
  range_combined <- filter(range_smooth, layer == "range")
  range_yearround <- range_combined[1, ]
  range_combined <- sf::st_geometry(range_combined)
  for (i in 2:length(range_combined)) {
    range_yearround <- sf::st_intersection(range_yearround, range_combined[i])
  }
  plot(st_geometry(range_yearround), 
       col = range_palette["year_round"], border = NA, 
       add = TRUE)
}
# linework
plot(ne_rivers, col = "#ffffff", lwd = 0.75, add = TRUE)
plot(ne_state_lines, col = "#ffffff", lwd = 1.5, add = TRUE)
plot(ne_country_lines, col = "#ffffff", lwd = 2, add = TRUE)

# legend
rng_legend <- rev(range_palette[legend_seasons])
names(rng_legend) <- names(rng_legend) %>% 
  str_replace_all("_", " ") %>% 
  str_to_title()
legend("bottomleft", legend = names(rng_legend), fill = rng_legend)
title(paste(birdCommonName, "Seasonal Range Map", sep= " "), 
      line = -1, cex.main = 1)


# 
# # to add context, let's pull in some reference data to add
# wh_states <- ne_states(country = c("United States of America", "Canada"),
#                        returnclass = "sf") %>%
#   st_transform(crs = mollweide) %>%
#   st_geometry()
# 
# # well plot a week in the middle of summer
# week26_moll <- projectRaster(abunds[[26]], crs = mollweide, method = "ngb")
# 
# # set graphics params
# par(mfrow = c(1, 1), mar = c(0, 0, 0, 6))
# 
# # use the extent object to set the spatial extent for the plot
# plot(st_as_sfc(st_bbox(trim(week26_moll))), col = "white", border = "white")
# 
# # add background spatial context
# plot(wh_states, col = "#eeeeee", border = NA, add = TRUE)
# 
# # plot zeroes as gray
# plot(week26_moll == 0, col = "#dddddd",
#      maxpixels = ncell(week26_moll),
#      axes = FALSE, legend = FALSE, add = TRUE)
# 
# # define color bins
# qcol <- abundance_palette(length(year_bins$bins) - 1, "weekly")
# 
# # plot abundances
# plot(week26_moll, breaks = year_bins$bins, col = qcol,
#      maxpixels = ncell(week26_moll),
#      axes = FALSE, legend = FALSE, add = TRUE)
# 
# # for legend, create a smaller set of bin labels
# bin_labels <- format(round(year_bins$bins, 2), nsmall = 2)
# bin_labels[!(bin_labels %in% c(bin_labels[1],
#                                bin_labels[round((length(bin_labels) / 2)) + 1],
#                                bin_labels[length(bin_labels)]))] <- ""
# bin_labels <- c("0", bin_labels)
# 
# # create colors that include gray for 0
# lcol <- c("#dddddd", qcol)
# 
# # set legend such that color ramp appears linearly
# ltq <- seq(from = year_bins$bins[1],
#            to = year_bins$bins[length(year_bins$bins)],
#            length.out = length(year_bins$bins))
# ltq <- c(0, ltq)
# 
# # plot legend
# plot(week26_moll^year_bins$power, legend.only = TRUE,
#      col = lcol, breaks = ltq^year_bins$power,
#      lab.breaks = bin_labels,
#      legend.shrink = 0.97, legend.width = 2,
#      axis.args = list(cex.axis = 0.9, lwd.ticks = 0))
# 
# # add state boundaries on top
# plot(wh_states, border = "white", lwd = 1.5, add = TRUE)


writeRaster(pred_region, filename = paste(printDirectory, birdcode, "Raster.tif", sep = ""), format="GTiff", bylayer=TRUE, suffix='numbers')
geojson_write(range_smooth, file = paste(printDirectory, birdcode, "RangeSmooth.geojson", sep = "" ))
write.csv(bird_dates, file = paste(printDirectory, birdcode, "Dates.csv", sep = ""))





