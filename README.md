# Sitemap service
This service can be used to generate a [sitemap](http://sitemaps.org) for a website, it's assumed you run this service in a mu.semte.ch stack.

## usage
Add to service to docker-compose.yml

```
version: "3.4"
services:
  sitemap:
    image: lblod/sitemap-service
    volumes: 
      - ./config/sitemap/:/config/
    links:
      - database:database
```

Create the appropriate query in `./config/sitemap/query.rq`. The query should select `url`, this url will be used in the sitemap.

Make sure to add the appropriate dispatcher rule:

```
get "/sitemap.xml" do
  Proxy.forward conn, [], "http://sitemap/sitemap.xml"
end
```


## roadmap
Currently this service is very much a proof of concept, the following improvements should be made:
 - support multiple queries as a source of the sitemap
 - regenerate the sitemap after a certain time
 - support batching for queries so long running queries can be optimized in batches
 - use auth-sudo for queries

