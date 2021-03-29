//! restraurant class
class Restaurant {
    constructor(name,address,lat,lng,averageRating = 0,totalRatings = 0,placeId,source,reviews = [],photos = []) {
      this.name = name;
      this.address = address;
      this.lat = lat;
      this.lng = lng;
      this.averageRating = averageRating;
      this.totalRatings = totalRatings;
      this.placeId = placeId;
      this.source = source;
      this.reviews = reviews;
      this.photos = photos;
      this.location = new google.maps.LatLng(lat, lng);
    }
  }

  
  
  //! restraurant storage for later ref, local storage can also be  used
  const RESTAURANTS_DB = {
    restaurants: [],
  };
  
  //! app()
  const APP = {
    //!get restraurant from local json and api & format it
    getRestaurants(lat, lng, map) {
      this._handleAllRestaurantData(
        [this._getJSONData(), this._getGoogleAPIData(lat, lng, map)],
        map
      );
    },
  
    //!fetch restraurant from local json & promise returned
    _getJSONData() {
      const LOCALDB_URL = "./data/restaurants.json";
      return fetch(LOCALDB_URL)
        .then((response) => {
          return response.ok
            ? response.json()
            : Promise.reject(response.statusText);
        })
        .catch((error) => {
          throw new Error(error);
        });
    },
  
    //!api req for near restraurant(promise returned with sourced data 4rm api)
    _getGoogleAPIData(lat, lng, map) {
      return new Promise((resolve, reject) => {
        const infoRequest = {
          location: new google.maps.LatLng(lat, lng),
          radius: 2500,
          keyword: "restaurant",
        };
        const searchService = new google.maps.places.PlacesService(map);
        searchService.nearbySearch(infoRequest, function (results, status) {
          if (status === "OK" || status === "ZERO_RESULTS") {
            resolve(results);
          } else {
            reject(new Error(status));
          }
        });
      }).catch(console.error);
    },
  
    /**
     * formats the received data(from api and local json)
     * restaurantDataPromiseArray - An array containing all promise(s) from API requests
     * *map* your map object
     */
  
    _handleAllRestaurantData(restaurantDataPromiseArray, map) {
      return Promise.all(restaurantDataPromiseArray)
        .then((restaurants) => {
          const restaurantData = [];
          // save restaurant_ids/place_ids for restaurants in our JSON
          // we use that to compare with place_ids from google sourced restaurants
          // so we don't duplicate restaurants
          const JSONRestaurantIDs = [];
          
          // 1st item in promise array 
          const restaurantsFromJSON = restaurants[0]; 
          //2nd item in promise array
          const restaurantsFromGoogleAPI = restaurants[1]; 
  
          //!render added restraurant to the list on the side bar
          function renderNewRestaurantList(data) {
            const listItem = document.createElement("li");
            const restaurantList = document.querySelector("#restaurants-list");
  
            listItem.innerHTML = `<section class="restaurant-details">
                                  <h3 class="restaurant-name">${data.restaurantName}</h3>
                                  <p class="restaurant-rating">${data.averageRating} Stars</p>
                                  <p class="restaurant-address">${data.address}</p>
                                </section>`;
            restaurantList.appendChild(listItem);
          }
  
          //!add retstraurant on map right click
          map.addListener("rightclick", (mapsMouseEvent) => {
            let restaurantName = document.getElementById("restaurantName");
            let address = document.getElementById("address");
            let restaurantRatings = document.getElementById("restaurantRatings");
            let restaurantButton = document.getElementById("restaurantButton");
            let span = document.getElementsByClassName("close");
            newRestaurantSection.style.display = "block";
  
            restaurantButton.addEventListener("click", function () {
              const newRestaurantMarker = new google.maps.Marker({
                position: mapsMouseEvent.latLng,
                map: map,
                title: restaurantName.value + "\n" + address.value,
                icon: "./img/marker.png",
              });
              let newRestaurantData = {
                restaurantName: restaurantName.value,
                address: address.value,
                averageRating:restaurantRatings.options[restaurantRatings.selectedIndex].value,
                totalRatings: "",
                source: "",
                reviews: "",
              };
  
              restaurantsFromJSON.push(newRestaurantData);
  
              newRestaurantSection.style.display = "none";
              let averageButton = document.getElementById("btn-lg");
  
              //!add the added new restraurant on sidebar on filter
              averageButton.addEventListener("click", (event) => {
                event.preventDefault();
                let result = ratingStars.options[ratingStars.selectedIndex].value;
                switch (result) {
                  case "None":{
                    if (newRestaurantData.averageRating === 0) {
                      renderNewRestaurantList(newRestaurantData);
                    }
                    break;
                  }
                  
                  case "one-rating":{
                    if (newRestaurantData.averageRating >= 1.0) {
                      renderNewRestaurantList(newRestaurantData);
                    }
                    break;
                  }
                  
                  case "two-rating":{
                    if (newRestaurantData.averageRating >= 2.0) {
                      renderNewRestaurantList(newRestaurantData);
                    }
                    break;
                  }
                   
                  case "three-rating":{
                    if (newRestaurantData.averageRating >= 3.0) {
                      renderNewRestaurantList(newRestaurantData);
                    }
                    break;
                  }
                   
                  case "four-rating":{
                    if (newRestaurantData.averageRating >= 4.0) {
                      renderNewRestaurantList(newRestaurantData);
                    }
                    break;
                  }
                   
                  case "five-rating":{
                    if (newRestaurantData.averageRating == 5.0) {
                      renderNewRestaurantList(newRestaurantData);
                    } else {
                      restaurantList.innerHTML = `<p> <strong> NOTHING TO DISPLAY </strong></p>`;
                    }
                    break;
                  }
                    
                }
              });
            });
  
            span[1].onclick = function () {
              newRestaurantSection.style.display = "none";
            };
          });
  
          for (const restaurant of restaurantsFromJSON) {
    
            //!api method for showing restraurants with the area map, since the json file might have some  located out of user map
            if (
              map.getBounds().contains({
                lat: restaurant.lat,
                lng: restaurant.lng,
              })
            ) {
              let jsonRestaurant = new Restaurant(
                restaurant.restaurantName,
                restaurant.address,
                restaurant.lat,
                restaurant.lng,
                restaurant.averageRating,
                restaurant.totalRatings,
                restaurant.restaurantId,
                restaurant.source,
                restaurant.reviews,
                restaurant.photos
              );
  
              restaurantData.push(jsonRestaurant);
         
              //!saving ids for comparing google sourder restraurants to avoid dubivation
              JSONRestaurantIDs.push(restaurant.restaurantId);
            }
          }
          for (const restaurant of restaurantsFromGoogleAPI) {
            if (!JSONRestaurantIDs.includes(restaurant.place_id)) {
              let googleRestaurant = new Restaurant(
                restaurant.name,
                restaurant.vicinity,
                restaurant.geometry.location.lat(),
                restaurant.geometry.location.lng(),
                restaurant.rating,
                restaurant.user_ratings_total,
                restaurant.place_id,
                restaurant.scope
              );
              restaurantData.push(googleRestaurant);
            }
          }
  
          // !google sourced api addinf review
          this._addReviewsFromGoogleAPI(restaurantData, map);
          //! saving reatsraurant data to avoid fetching all time
          this._storeRestaurantData(restaurantData);
          //!Diplay restrant datato browser
          this.displayRestaurants(RESTAURANTS_DB.restaurants, map);
        })
        .catch((error) => {
          console.error(error);
        });
    },
  
    /**
     * Get reviews from Google Maps API requests
     * Add the reviews to Google sourced restaurants
     */
    _addReviewsFromGoogleAPI(restaurantData, map) {
      const googleAPIRestaurantIds = [];
      for (const restaurant of restaurantData) {
        if (restaurant.source === "GOOGLE") {
          googleAPIRestaurantIds.push(restaurant.placeId);
        }
      }
      for (const id of googleAPIRestaurantIds) {
        this._getReviews(id, restaurantData, map);
      }
    },
  
    //!place detail req to get reviews for google sourced restraurants
    _getReviews(restaurantId, restaurantData, map) {
      const searchService = new google.maps.places.PlacesService(map);
      const request = {
        placeId: restaurantId,
        fields: ["reviews"],
      };
      searchService.getDetails(request, function (place, status) {
        if (status === "OK") {
          for (const restaurant of restaurantData) {
            if (restaurant.placeId === restaurantId) {
              const restaurantReviews = [];
              if (place.reviews !== undefined && place.reviews.length > 0) {
                for (const review of place.reviews) {
                  let reviewInfo = {
                    name: review.author_name,
                    rating: review.rating,
                    comment: review.text,
                  };
                  restaurantReviews.push(reviewInfo);
                }
              }
  
              for (const review of restaurantReviews) {
                restaurant.reviews.push(review);
              }
            }
          }
        }
      });
    },
  
    //!store restraurant for later ref
    _storeRestaurantData(restaurantData) {
      for (const restaurant of restaurantData) {
        RESTAURANTS_DB.restaurants.push(restaurant);
      }
    },
  
    //!lisy of restraurant displeyd on side bar
    renderTheList(data) {
      const listItem = document.createElement("li");
      const restaurantList = document.querySelector("#restaurants-list");
      listItem.dataset.placeId = data.placeId;
      listItem.innerHTML = `<section class="restaurant-details">
                                  <h3 class="restaurant-name">${data.name}</h3> 
                                  <p class="restaurant-rating">${data.averageRating} Stars</p> 
                                  <p class="restaurant-address">${data.address}</p>
                                </section>`;
      restaurantList.appendChild(listItem);
    },
  
    displayRestaurants(restaurants, map) {
      const restaurantList = document.querySelector("#restaurants-list");
      let googlePlaceReviews = document.getElementById("google_reviews");
      let placeDetailsSection = document.getElementById("placeDetails-section");
      placeDetailsSection.style.display = "none";
      let span = document.getElementsByClassName("close");
  
      let reviewsSection = document.getElementById("reviews-section");
      reviewsSection.style.display = "none";
      let starRating = document.getElementById("starRating");
      let name = document.getElementById("name");
      let comment = document.getElementById("comment");
      let newReviews = document.getElementById("newReviews");
      let ratingsButton = document.getElementById("ratings-button");
      let newRatings = document.getElementById("newRatings");
  
      const ratingStars = document.getElementById("ratingStars");
      let averageButton = document.getElementById("btn-lg");
  
      //! create markers
      for (const restaurant of restaurants) {
        const marker = new google.maps.Marker({
          position: restaurant.location,
          map: map,
          title: restaurant.name + "\n" + restaurant.address,
          placeId: restaurant.placeId,
          randomTxt: "lorem ipsum",
          //! reviews stored in the marker object option
          reviews: restaurant.reviews,
          icon: "./img/marker.png",
        });
  
        //! filtering based on the avarage rating 
        averageButton.addEventListener("click", (event) => {
          event.preventDefault();
          let result = ratingStars.options[ratingStars.selectedIndex].value;
          switch (result) {
            case "None":{
              if (restaurant.averageRating === 0) {
                this.renderTheList(restaurant);
              }
              break;
            }
              
            case "one-rating":{
              if (restaurant.averageRating >= 1.0) {
                this.renderTheList(restaurant);
              }
              break;
            }
             
            case "two-rating":{
              if (restaurant.averageRating >= 2.0) {
                this.renderTheList(restaurant);
              }
              break;
            }
              
            case "three-rating":{
              if (restaurant.averageRating >= 3.0) {
                this.renderTheList(restaurant);
              }
              break;
            }
              
            case "four-rating":{
              if (restaurant.averageRating >= 4.0) {
                this.renderTheList(restaurant);
              }
              break;
            }
              
            case "five-rating":{
              if (restaurant.averageRating == 5.0) {
                this.renderTheList(restaurant);
              } else {
                restaurantList.innerHTML = `<p> <strong> NOTHING TO DISPLAY </strong></p>`;
              }
              break;
            }
              
          }
        });
  
        document.body.addEventListener("change", (e) => {
          if (e.target.matches("select")) {
            restaurantList.innerHTML = "";
          }
        });
  
        //! onclick marker diplay reviews
        google.maps.event.addListener(marker, "click", () => {
          let reviewData = "";
          placeDetailsSection.style.display = "block";
  
          if (marker.reviews.length > 0) {
            reviewsSection.style.display = "none";
            for (const reviewer of marker.reviews) {
              // Display Reviews
              reviewData += `<div><h1> Restaurant Reviews </h1> <div>
              <div>NAME: ${reviewer.name}</div>
                            <div>COMMENT:<em>${reviewer.comment}</em> </div>
                            <div>RATING: ${reviewer.rating} star(s)</div>`;
            }
          } else {
            reviewData = "NO REVIEWS";
          }
  
          googlePlaceReviews.innerHTML = reviewData;
          span[0].onclick = function () {
            placeDetailsSection.style.display = "none";
          };
          if (restaurant.source === "local") {
            reviewsSection.style.display = "block";
            googlePlaceReviews.innerHTML =
              "<img src='" +
              restaurant.photos[0].streetviewURL +
              "'/>" +
              reviewData;
            ratingsButton.addEventListener("click", function () {
              newReviews.innerHTML =
                "NAME: " +
                name.value +
                "<br>" +
                "COMMENT: " +
                comment.value +
                "<br>" +
                "RATING: " +
                starRating.value;
              newRatings.style.display = "none";
            });
          }
        });
      }
    },
  };
  