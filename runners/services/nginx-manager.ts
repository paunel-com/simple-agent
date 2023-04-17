import {IApp} from '../../types/app';

export const BASIC_STRUCTURE = `
events {
    worker_connections  1024;
}

http {
  types {
      text/html                                        html htm shtml;
      text/css                                         css;
      text/xml                                         xml;
      image/gif                                        gif;
      image/jpeg                                       jpeg jpg;
      application/javascript                           js;
      application/atom+xml                             atom;
      application/rss+xml                              rss;
  
      text/mathml                                      mml;
      text/plain                                       txt;
      text/vnd.sun.j2me.app-descriptor                 jad;
      text/vnd.wap.wml                                 wml;
      text/x-component                                 htc;
  
      image/avif                                       avif;
      image/png                                        png;
      image/svg+xml                                    svg svgz;
      image/tiff                                       tif tiff;
      image/vnd.wap.wbmp                               wbmp;
      image/webp                                       webp;
      image/x-icon                                     ico;
      image/x-jng                                      jng;
      image/x-ms-bmp                                   bmp;
  
      font/woff                                        woff;
      font/woff2                                       woff2;
  
      application/java-archive                         jar war ear;
      application/json                                 json;
      application/mac-binhex40                         hqx;
      application/msword                               doc;
      application/pdf                                  pdf;
      application/postscript                           ps eps ai;
      application/rtf                                  rtf;
      application/vnd.apple.mpegurl                    m3u8;
      application/vnd.google-earth.kml+xml             kml;
      application/vnd.google-earth.kmz                 kmz;
      application/vnd.ms-excel                         xls;
      application/vnd.ms-fontobject                    eot;
      application/vnd.ms-powerpoint                    ppt;
      application/vnd.oasis.opendocument.graphics      odg;
      application/vnd.oasis.opendocument.presentation  odp;
      application/vnd.oasis.opendocument.spreadsheet   ods;
      application/vnd.oasis.opendocument.text          odt;
      application/vnd.openxmlformats-officedocument.presentationml.presentation
                                                       pptx;
      application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
                                                       xlsx;
      application/vnd.openxmlformats-officedocument.wordprocessingml.document
                                                       docx;
      application/vnd.wap.wmlc                         wmlc;
      application/wasm                                 wasm;
      application/x-7z-compressed                      7z;
      application/x-cocoa                              cco;
      application/x-java-archive-diff                  jardiff;
      application/x-java-jnlp-file                     jnlp;
      application/x-makeself                           run;
      application/x-perl                               pl pm;
      application/x-pilot                              prc pdb;
      application/x-rar-compressed                     rar;
      application/x-redhat-package-manager             rpm;
      application/x-sea                                sea;
      application/x-shockwave-flash                    swf;
      application/x-stuffit                            sit;
      application/x-tcl                                tcl tk;
      application/x-x509-ca-cert                       der pem crt;
      application/x-xpinstall                          xpi;
      application/xhtml+xml                            xhtml;
      application/xspf+xml                             xspf;
      application/zip                                  zip;
  
      application/octet-stream                         bin exe dll;
      application/octet-stream                         deb;
      application/octet-stream                         dmg;
      application/octet-stream                         iso img;
      application/octet-stream                         msi msp msm;
  
      audio/midi                                       mid midi kar;
      audio/mpeg                                       mp3;
      audio/ogg                                        ogg;
      audio/x-m4a                                      m4a;
      audio/x-realaudio                                ra;
  
      video/3gpp                                       3gpp 3gp;
      video/mp2t                                       ts;
      video/mp4                                        mp4;
      video/mpeg                                       mpeg mpg;
      video/quicktime                                  mov;
      video/webm                                       webm;
      video/x-flv                                      flv;
      video/x-m4v                                      m4v;
      video/x-mng                                      mng;
      video/x-ms-asf                                   asx asf;
      video/x-ms-wmv                                   wmv;
      video/x-msvideo                                  avi;
  }
  
  server {
    listen 80;
    server_name _;
    server_name_in_redirect off;
    root  /var/www/default/htdocs;
  }

# PAUNEL_SERVER_PLACEHOLDER

}
`

export function getServerBlock(id, hostname: string, internalHostname: string, port: string | number = 80) {
  return `
  # PROXY FOR APP: ${id}
      server {
        listen 80;
        server_name ${hostname};

        location / {
            proxy_pass http://${internalHostname}:${port};
            proxy_set_header Host       $proxy_host;
        }
    }
  # END PROXY FOR APP: ${id}
`
}

export async function createNginxConfig($) {
  await $`CONF_VALUE=$(ls)
  if [[ "$CONF_VALUE" != *"nginx.conf"* ]]; then touch nginx.conf; fi;`

  await $`CONF_VALUE=$(cat nginx.conf)
  if [[ "$CONF_VALUE" != *"# PAUNEL_SERVER_PLACEHOLDER"* ]];
   then 
    echo ${BASIC_STRUCTURE} > nginx.conf
   fi;`
}

export async function addAppConfig($, app: IApp) {
  await $`CONF_VALUE=$(cat nginx.conf)
  if [[ "$CONF_VALUE" != *"# PROXY FOR APP: ${app.identifier}"* ]];
  then
    INSERT_LINE=$(awk "/# PAUNEL_SERVER_PLACEHOLDER/{ print NR; exit }" nginx.conf);
    echo $INSERT_LINE;
    CONTENT=${getServerBlock(app.identifier, app.hostname, app.internalHostname, app.port)}
    awk -v "INSERT_LINE=$INSERT_LINE" -v "CONTENT=$CONTENT" 'NR==INSERT_LINE{print CONTENT}1' nginx.conf > new_nginx.conf;
    mv new_nginx.conf nginx.conf
    echo "run" > rerun.txt;
  fi;`
}


export async function removeAppConfig($, app: IApp) {
  await $`CONF_VALUE=$(cat nginx.conf)
  if [[ "$CONF_VALUE" == *"# PROXY FOR APP: ${app.identifier}"* ]];
  then
    awk '/# PROXY FOR APP: ${app.identifier}/,/# END PROXY FOR APP: ${app.identifier}/{next}1' nginx.conf > new_nginx.conf;
    mv new_nginx.conf nginx.conf
    echo "run" > rerun.txt;
  fi;`
}

export async function runNginxWithConf($, DOCKER_NETWORK_NAME) {
  try {
    await $`if [[ -f rerun.txt && "$(cat rerun.txt)" == "run" ]];
      then
        docker pull nginx && \
        docker rm -f paunel-gateway && \
        docker run --name paunel-gateway --rm --network=${DOCKER_NETWORK_NAME} -v $PWD/nginx.conf:/etc/nginx/nginx.conf:ro -p 80:80 -d nginx && \
        rm rerun.txt;
      fi`
  } catch {
    //
  }
}