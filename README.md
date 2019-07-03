# Sitemap service
This service can be used to generate a [sitemap](http://sitemaps.org) for a website, it's assumed you run this service in a mu.semte.ch stack.

## Usage
Add to service to docker-compose.yml

```
version: "3.4"
services:
  sitemap:
    image: lblod/sitemap-service
    environment:
      SITEMAP_MAX_AGE: 5
    volumes:
      - ./config/sitemap/:/config/
    links:
      - database:database
```

Create the appropriate query in `./config/sitemap/query.rq`. The query should select `url`. This url will be used in the sitemap.
The query doesn't need to select the base url of the website, it will be automatically deduced by the service.

Make sure to add the appropriate dispatcher rule:

```
get "/sitemap.xml" do
  Proxy.forward conn, [], "http://sitemap/sitemap.xml"
end
```

### Environment variables

```
SITEMAP_MAX_AGE: optional, default '5' : the maximum age allowed for the sitemap, in minutes
```

## Roadmap
Currently this service is very much a proof of concept, the following improvements should be made:
 - support batching for queries so long running queries can be optimized in batches
 - use auth-sudo for queries
