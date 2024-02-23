const axios = require("axios");
const config = require("../config");

module.exports = {
  method: "GET",
  path: "/answer",
  options: {
    handler: async (request, h) => {
      const url = "http://host.docker.internal:3002/single-request";

      try {
        const response = await axios.get(url);

        const messages = response.data;
        console.log(messages);

        const envTest = config.envTest;
        console.log(`envTest: ${envTest}`);
  
        return h.view("answer", {
          messages,
        });
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
  },
};
