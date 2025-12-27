// Manual mappings for ports that don't match exactly between Excel and database
// Format: "excel-name|excel-country" -> "database-name|database-country"

export const portNameMappings: Record<string, string> = {
  // Spelling corrections
  "geralton|australia": "geraldton|australia",
  "haypoint|australia": "hay point|australia",
  "marseilles|france": "marseille|france",
  "mombassa|kenya": "mombasa|kenya",
  "kaoshiung|taiwan": "kaohsiung|taiwan",
  "instanbul|turkey": "istanbul|turkey",
  "goteborg|sweden": "gothenburg|sweden",

  // Country name corrections
  "auckland|new zeland": "auckland|new zealand",
  "tauranga|new zeland": "tauranga|new zealand",
  "jeddah|south arabia": "jeddah|saudi arabia",
  "jubail|south arabia": "jubail|saudi arabia",
  "ras tanura|south arabia": "ras tanura|saudi arabia",
  "yanbu|south arabia": "yanbu|saudi arabia",

  // Alternative names
  "port elisabeth|south africa": "port elizabeth|south africa",
  "saldhana bay|south africa": "saldanha bay|south africa",
  "dares salaam|tanzania": "dar es salaam|tanzania",
  "daressalaam|tanzania": "dar es salaam|tanzania",
  "bahia blanca|argentina": "bahia blanca|argentina",
  "ponta do ubu|brazil": "ponta do ubu|brazil",
  "bandar khomeini|iran": "bandar khomeini|iran",

  // Newly added ports from CSV data
  "sepetiba bay|brazil": "sepetiba|brazil",
  "tubarao|brazil": "tubarao|brazil",
  "baie comeau|canada": "baie-comeau|canada",
  "churchill|canada": "churchill|canada",
  "port cartier|canada": "port-cartier|canada",
  "valparaiso|chile": "valparaiso|chile",
  "puerto bolivar|colombia": "puerto bolivar|colombia",
  "san nicolas|peru": "san nicolas|peru",
  "loop|usa": "loop|usa",
};
