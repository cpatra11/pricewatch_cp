import axios from "axios";
import * as cheerio from "cheerio";
import { resolveObjectURL } from "buffer";
import { extractCurrency, extractDescription, extractPrice } from "../utils";

export async function scrapeAmazonProduct(url: string) {
  if (!url) return;

  // curl --proxy brd.superproxy.io:22225 --proxy-user brd-customer-hl_e3a35090-zone-pricewise:y7k54ldc16j5 -k "https://geo.brdtest.com/welcome.txt"

  //BrightData proxy configuration
  const username = String(process.env.BRIGHTDATA_USERNAME);
  const password = String(process.env.BRIGHTDATA_PASSWORD);

  const port = 2225;
  const session_id = (1000000 * Math.random()) | 0;

  const options = {
    auth: {
      username: `${username}-session-${session_id}`,
      password,
    },
    host: "brd.superproxy.io",
    port,
    resolveUnauthorized: false,
  };

  try {
    ///fetch the product page

    const response = await axios.get(url, options);
    const $ = cheerio.load(response.data);

    // Extract product title
    const title = $("#productTitle").text().trim();
    const currentPrice = extractPrice(
      $(".priceToPay span.a-price-whole"),
      $("a.size.base.a-color-price"),
      $(".a-button-selected .a-color-base"),
      $(".a-price-whole"),
      $(".a-price-fraction"),
      $(".a-price-symbol")
    );

    const originalPrice = extractPrice(
      $("#priceblock_outprice"),
      $(".a-price.a-text-price span.a-offscreen"),
      $("#listPrice"),
      $("#priceblock_dealprice"),
      $(".a-size-base.a-color-price")
    );

    const outOfStock =
      $("#availability span").text().trim().toLowerCase() ===
      "currently unavailable";

    const image =
      $("#imgBlkFront").attr("data-a-dynamic-image") ||
      $("#landingImage").attr("data-a-dynamic-image") ||
      "{}";

    const imageUrls = Object.keys(JSON.parse(image));

    const currency = extractCurrency($(".a-price-symbol"));

    const discountRate = $(".savingsPercentage").text().replace(/[-%]/g, "");

    const description = extractDescription($);

    // construct data object using scraped information

    const data = {
      url,
      currency: currency || "$",
      image: imageUrls[0],
      title,
      currentPrice:
        Number(await Promise.resolve(currentPrice)) || originalPrice,
      originalPrice:
        Number(await Promise.resolve(originalPrice)) || currentPrice,
      priceHistory: [],
      discountRate: Number(discountRate),
      isOutOfStock: outOfStock,
      category: "category",
      reviewsCount: 100,
      stars: 4.5,
      description,
      lowestPrice: Number(currentPrice) || Number(originalPrice),
      highestPrice: Number(originalPrice) || Number(currentPrice),
      averagePrice: (Number(currentPrice) + Number(originalPrice)) / 2,
    };
    return data;
  } catch (error: any) {
    throw new Error(`Failed to scrape product: ${error.message}`);
  }
}
