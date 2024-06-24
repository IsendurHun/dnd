const version = "10.0.01";
try {
    const origin = args[0].itemUuid;
    if (origin) {
        const removeList = actor.effects.filter(ae => ae.origin === origin && getProperty(ae, "flags.dae.transfer") !== 3).map(ae=>ae.id);
        await actor.deleteEmbeddedDocuments("ActiveEffect", removeList)
    }
    const sc_mod = Number(args[0].actor.system.abilities[args[0].actor.system.attributes.spellcasting]?.mod);
    const prof = Number(args[0].actor.system.attributes.prof);
    const spell_dc = 8 + sc_mod + prof;
    const rsak = Number(args[0].actor.system.bonuses.rsak.attack);
    const spell_level = Number(args[0].spellLevel-4);

    const updates = {
        Item: {
            "Storm Sphere Attack": {
                "type": "weapon",
                "system.actionType" : "rsak",
                "system.properties.mgc": true,
                "system.attackBonus": `${sc_mod + prof + rsak}`,
                "system.proficient": false,
                "system.damage.parts":[[`${ 4 + spell_level}d6`,"lightning"]]
            },

            "Storm Sphere Aura damage": {
                "system.properties.mgc": true,
                "system.save.dc": `${spell_dc}`,
                "system.proficient": false,
                "system.damage.parts":[[`${ 2 + spell_level}d6`,"bludgeoning"]]
            }
        }
    };

    const dae_config = {
        turn: "end",
        label: "Storm Sphere",
        damageRoll: "3d6",
        damageType: "bludgeoning",
        saveRemove: false,
        saveMagic: true,
        saveDC: spell_dc,
        saveAbility: "str",
        saveDamage: "nodamage",
        killAnim: true
    };
    const dae_str = JSON.stringify(dae_config)
        .replace(/:/g,'=')
        .replace(/["{}]/g, '')
        .replace(/,/g, ',\r\n');


    const result = await warpgate.spawn("Storm Sphere",  {embedded: updates}, {}, {});
    if (result.length !== 1) return;

    const createdToken = game.canvas.tokens.get(result[0]);

    createdToken.actor.items.getName("ST Aura damage Trigger").collections.effects.getName('ST Aura damage Trg').changes[0].value=dae_str;

    const targetUuid = createdToken.document.uuid;

    await actor.createEmbeddedDocuments("ActiveEffect", [{
        label: "Summon",
        icon: args[0].item.img,
        origin,
        duration: {seconds: 60, rounds:10},
        "flags.dae.stackable": false,
        changes: [{key: "flags.dae.deleteUuid", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: [targetUuid]}]
    }]);

    new Sequence()
        .effect()
        .name(`Storm Sphere-${createdToken.id}`)
        .file("modules/jb2a_patreon/Library/7th_Level/Whirlwind/Whirlwind_01_Blue_400x400.webm")
        .attachTo(createdToken)
        //      .belowTokens(true)
        .scale(3)
        .persist()
        .opacity(0.9)
        //      .tint("#0d0c0c")
        .fadeIn(1000, { ease: "easeInCubic"})
        .play()

} catch (err) {
    console.error(`${args[0].itemData.name} - Storm Sphere ${version}`, err);
}